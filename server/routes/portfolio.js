// routes/portfolios.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const { verifyAccess } = require('../middleware/authMiddleware');

/* -------------------------------- Helpers -------------------------------- */

function exec(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.execute(sql, params, (err, rows, fields) => {
      if (err) return reject(err);
      resolve([rows, fields]);
    });
  });
}

const asJSON = (obj) => {
  try { return JSON.stringify(obj ?? {}); } catch { return '{}'; }
};

function getUid(req) {
  return req?.user?.id ?? req?.user?.sub ?? null;
}

async function ensurePortfolioOwner(portfolioId, userId) {
  const [rows] = await exec(
    'SELECT id FROM portfolios WHERE id = ? AND user_id = ?',
    [portfolioId, userId]
  );
  return rows.length > 0;
}

async function ensureItemOwner(itemId, userId) {
  const [rows] = await exec(
    `SELECT pi.id
       FROM portfolio_items pi
       JOIN portfolios p ON p.id = pi.portfolio_id
      WHERE pi.id = ? AND p.user_id = ?`,
    [itemId, userId]
  );
  return rows.length > 0;
}

/* ------------------------------ PORTFOLIOS ------------------------------- */

// Create portfolio
router.post('/', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    let { title, subtitle = null, bio = null, slug, is_public = 0 } = req.body;
    if (!title || !slug) return res.status(400).json({ message: 'title and slug are required' });

    title = String(title).trim().slice(0, 120);
    slug  = String(slug).trim().slice(0, 120);
    if (subtitle !== null && subtitle !== undefined) subtitle = String(subtitle).slice(0, 200);
    if (typeof bio === 'string') bio = bio.trim();

    const [[u]] = await exec('SELECT id FROM users WHERE id = ?', [uid]);
    if (!u) return res.status(401).json({ message: 'User not found' });

    const sql = `
      INSERT INTO portfolios (user_id, title, subtitle, bio, slug, is_public)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await exec(sql, [
      uid, title, subtitle, bio, slug, Number(is_public ? 1 : 0),
    ]);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('CREATE PORTFOLIO ERROR:', err);
    if (err?.code === 'ER_DUP_ENTRY')      return res.status(409).json({ message: 'Slug already in use for this user' });
    if (err?.code === 'ER_DATA_TOO_LONG')  return res.status(422).json({ message: 'One or more fields exceed maximum length' });
    if (err?.code === 'ER_NO_REFERENCED_ROW_2') return res.status(401).json({ message: 'User not found or unauthorized' });
    res.status(500).json({ message: 'Create portfolio failed' });
  }
});

// Get all portfolios for current user
router.get('/me', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const [rows] = await exec(
      `SELECT id, title, subtitle, bio, slug, is_public, created_at, updated_at
         FROM portfolios
        WHERE user_id = ?
     ORDER BY created_at DESC`,
      [uid]
    );
    res.json(rows);
  } catch (err) {
    console.error('FETCH PORTFOLIOS ERROR:', err);
    res.status(500).json({ message: 'Fetch portfolios failed' });
  }
});
router.get('/:id', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { id } = req.params;
    const owns = await ensurePortfolioOwner(id, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const [rows] = await exec(
      `SELECT p.id, p.title, p.subtitle, p.bio, p.slug, p.is_public, p.created_at, p.updated_at
         FROM portfolios p
        WHERE p.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Portfolio not found' });

    const [assets] = await exec(
      `SELECT id, asset_type, url, label
         FROM portfolio_assets
        WHERE portfolio_id = ?
     ORDER BY id DESC`,
      [id]
    );

    res.json({ ...rows[0], assets });
  } catch (err) {
    console.error('READ PORTFOLIO BY ID ERROR:', err);
    res.status(500).json({ message: 'Fetch portfolio failed' });
  }
});


// Public full fetch by slug (no auth)
router.get('/p/:slug/full', async (req, res) => {
  try {
    const { slug } = req.params;

    const [pRows] = await exec(
      `SELECT id, user_id, title, subtitle, bio, slug, is_public, created_at, updated_at
         FROM portfolios
        WHERE slug = ? AND is_public = 1`,
      [slug]
    );
    if (!pRows.length) return res.status(404).json({ message: 'Portfolio not found' });
    const p = pRows[0];

    const [assets] = await exec(
      `SELECT id, asset_type, url, label
         FROM portfolio_assets
        WHERE portfolio_id = ?
     ORDER BY id ASC`,
      [p.id]
    );

    const [items] = await exec(
      `SELECT id, title, description, category, tech_stack, meta, order_index
         FROM portfolio_items
        WHERE portfolio_id = ?
     ORDER BY order_index ASC, created_at DESC`,
      [p.id]
    );

    // links / images grouped by item
    const [links] = await exec(
      `SELECT id, item_id, label, url, link_type, order_index
         FROM portfolio_links
        WHERE item_id IN (SELECT id FROM portfolio_items WHERE portfolio_id = ?)`,
      [p.id]
    );
    const [images] = await exec(
      `SELECT id, item_id, url, alt_text, order_index
         FROM portfolio_images
        WHERE item_id IN (SELECT id FROM portfolio_items WHERE portfolio_id = ?)`,
      [p.id]
    );

    // re-shape items with children
    const byItem = id => ({
      links: links.filter(l => l.item_id === id),
      images: images.filter(im => im.item_id === id),
    });
    const itemsFull = items.map(it => ({ ...it, ...byItem(it.id) }));

    res.json({ portfolio: p, assets, items: itemsFull });
  } catch (err) {
    console.error('PUBLIC FULL FETCH ERROR:', err);
    res.status(500).json({ message: 'Fetch portfolio failed' });
  }
});


router.get('/slug-available/:slug', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });
    const { slug } = req.params;
    const [rows] = await exec('SELECT 1 FROM portfolios WHERE user_id = ? AND slug = ?', [uid, slug]);
    res.json({ available: rows.length === 0 });
  } catch (err) {
    console.error('SLUG AVAIL ERROR:', err);
    res.status(500).json({ message: 'Check failed' });
  }
});

/* ---------------------------- PORTFOLIO ITEMS ---------------------------- */

// Create item
router.post('/portfolio-items', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const {
      portfolio_id,
      title,
      description = null,
      category = null,
      tech_stack = null,
      meta = {},
      order_index = 0,
    } = req.body;

    if (!portfolio_id || !title) {
      return res.status(400).json({ message: 'portfolio_id and title are required' });
    }

    const owns = await ensurePortfolioOwner(portfolio_id, uid);
    if (!owns) return res.status(404).json({ message: 'Portfolio not found or unauthorized' });

    const sql = `
      INSERT INTO portfolio_items
        (portfolio_id, user_id, title, description, category, tech_stack, meta, order_index)
      VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?)
    `;
    const [result] = await exec(sql, [
      portfolio_id,
      uid,
      String(title).slice(0, 200),
      description,
      category,
      tech_stack,
      asJSON(meta),
      order_index,
    ]);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('CREATE ITEM ERROR:', err);
    if (err?.code === 'ER_DATA_TOO_LONG') return res.status(422).json({ message: 'One or more fields exceed maximum length' });
    res.status(500).json({ message: 'Create item failed' });
  }
});

// Read items for a portfolio
router.get('/:portfolioId/items', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { portfolioId } = req.params;
    const owns = await ensurePortfolioOwner(portfolioId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const [rows] = await exec(
      `SELECT id, portfolio_id, user_id, title, description, category, tech_stack, meta, order_index,
              created_at, updated_at
         FROM portfolio_items
        WHERE portfolio_id = ?
     ORDER BY order_index ASC, created_at DESC`,
      [portfolioId]
    );
    res.json(rows);
  } catch (err) {
    console.error('FETCH ITEMS ERROR:', err);
    res.status(500).json({ message: 'Fetch items failed' });
  }
});

// Read single item
router.get('/portfolio-items/:itemId', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { itemId } = req.params;
    const owns = await ensureItemOwner(itemId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const [rows] = await exec(
      `SELECT id, portfolio_id, user_id, title, description, category, tech_stack, meta, order_index,
              created_at, updated_at
         FROM portfolio_items
        WHERE id = ?`,
      [itemId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error('FETCH ITEM ERROR:', err);
    res.status(500).json({ message: 'Fetch item failed' });
  }
});

// Update item
router.put('/portfolio-items/:itemId', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { itemId } = req.params;
    const owns = await ensureItemOwner(itemId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const allowed = ['title','description','category','tech_stack','meta','order_index'];
    const sets = [];
    const params = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'meta') {
          sets.push('meta = CAST(? AS JSON)');
          params.push(asJSON(req.body.meta));
        } else if (key === 'title') {
          sets.push('title = ?'); params.push(String(req.body[key]).slice(0, 200));
        } else {
          sets.push(`${key} = ?`); params.push(req.body[key]);
        }
      }
    }
    if (!sets.length) return res.json({ message: 'Nothing to update' });

    const sql = `UPDATE portfolio_items SET ${sets.join(', ')} WHERE id = ?`;
    params.push(itemId);
    await exec(sql, params);
    res.json({ message: 'Item updated' });
  } catch (err) {
    console.error('UPDATE ITEM ERROR:', err);
    if (err?.code === 'ER_DATA_TOO_LONG') return res.status(422).json({ message: 'One or more fields exceed maximum length' });
    res.status(500).json({ message: 'Update item failed' });
  }
});

// Delete item
router.delete('/portfolio-items/:itemId', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { itemId } = req.params;
    const owns = await ensureItemOwner(itemId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    await exec('DELETE FROM portfolio_items WHERE id = ?', [itemId]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('DELETE ITEM ERROR:', err);
    res.status(500).json({ message: 'Delete item failed' });
  }
});

/* --------------------------------- LINKS --------------------------------- */

router.post('/portfolio-items/:itemId/links', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { itemId } = req.params;
    const owns = await ensureItemOwner(itemId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const { label, url, link_type = null, order_index = 0 } = req.body;
    if (!label || !url) return res.status(400).json({ message: 'label and url are required' });

    const [result] = await exec(
      `INSERT INTO portfolio_links (item_id, label, url, link_type, order_index)
       VALUES (?, ?, ?, ?, ?)`,
      [itemId, String(label).slice(0, 80), url, link_type, order_index]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('ADD LINK ERROR:', err);
    if (err?.code === 'ER_DATA_TOO_LONG') return res.status(422).json({ message: 'One or more fields exceed maximum length' });
    res.status(500).json({ message: 'Add link failed' });
  }
});

// Update link
router.put('/portfolio-links/:linkId', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { linkId } = req.params;

    const [chk] = await exec(
      `SELECT pl.id
         FROM portfolio_links pl
         JOIN portfolio_items pi ON pi.id = pl.item_id
         JOIN portfolios p ON p.id = pi.portfolio_id
        WHERE pl.id = ? AND p.user_id = ?`,
      [linkId, uid]
    );
    if (!chk.length) return res.status(404).json({ message: 'Not found or unauthorized' });

    const { label, url, link_type, order_index } = req.body;
    const sets = [];
    const params = [];
    if (label !== undefined)      { sets.push('label = ?');      params.push(String(label).slice(0, 80)); }
    if (url !== undefined)        { sets.push('url = ?');        params.push(url); }
    if (link_type !== undefined)  { sets.push('link_type = ?');  params.push(link_type); }
    if (order_index !== undefined){ sets.push('order_index = ?');params.push(order_index); }

    if (!sets.length) return res.json({ message: 'Nothing to update' });

    params.push(linkId);
    await exec(`UPDATE portfolio_links SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Link updated' });
  } catch (err) {
    console.error('UPDATE LINK ERROR:', err);
    if (err?.code === 'ER_DATA_TOO_LONG') return res.status(422).json({ message: 'One or more fields exceed maximum length' });
    res.status(500).json({ message: 'Update link failed' });
  }
});

// Delete link
router.delete('/portfolio-links/:linkId', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { linkId } = req.params;
    const [chk] = await exec(
      `SELECT pl.id
         FROM portfolio_links pl
         JOIN portfolio_items pi ON pi.id = pl.item_id
         JOIN portfolios p ON p.id = pi.portfolio_id
        WHERE pl.id = ? AND p.user_id = ?`,
      [linkId, uid]
    );
    if (!chk.length) return res.status(404).json({ message: 'Not found or unauthorized' });

    await exec('DELETE FROM portfolio_links WHERE id = ?', [linkId]);
    res.json({ message: 'Link deleted' });
  } catch (err) {
    console.error('DELETE LINK ERROR:', err);
    res.status(500).json({ message: 'Delete link failed' });
  }
});

/* -------------------------------- IMAGES --------------------------------- */

// Add image
router.post('/portfolio-items/:itemId/images', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { itemId } = req.params;
    const owns = await ensureItemOwner(itemId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const { url, alt_text = null, order_index = 0 } = req.body;
    if (!url) return res.status(400).json({ message: 'url is required' });

    const [result] = await exec(
      `INSERT INTO portfolio_images (item_id, url, alt_text, order_index)
       VALUES (?, ?, ?, ?)`,
      [itemId, url, alt_text, order_index]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('ADD IMAGE ERROR:', err);
    if (err?.code === 'ER_DATA_TOO_LONG') return res.status(422).json({ message: 'One or more fields exceed maximum length' });
    res.status(500).json({ message: 'Add image failed' });
  }
});

// Delete image
router.delete('/portfolio-images/:imageId', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { imageId } = req.params;

    const [chk] = await exec(
      `SELECT pi.id
         FROM portfolio_images pi
         JOIN portfolio_items it ON it.id = pi.item_id
         JOIN portfolios p ON p.id = it.portfolio_id
        WHERE pi.id = ? AND p.user_id = ?`,
      [imageId, uid]
    );
    if (!chk.length) return res.status(404).json({ message: 'Not found or unauthorized' });

    await exec('DELETE FROM portfolio_images WHERE id = ?', [imageId]);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error('DELETE IMAGE ERROR:', err);
    res.status(500).json({ message: 'Delete image failed' });
  }
});

/* -------------------------------- ASSETS --------------------------------- */

// Add asset
router.post('/:portfolioId/assets', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { portfolioId } = req.params;
    const owns = await ensurePortfolioOwner(portfolioId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const { asset_type, url, label = null } = req.body;
    if (!asset_type || !url) return res.status(400).json({ message: 'asset_type and url are required' });

    const [result] = await exec(
      `INSERT INTO portfolio_assets (portfolio_id, asset_type, url, label)
       VALUES (?, ?, ?, ?)`,
      [portfolioId, asset_type, url, label]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('ADD ASSET ERROR:', err);
    if (err?.code === 'ER_DATA_TOO_LONG') return res.status(422).json({ message: 'One or more fields exceed maximum length' });
    res.status(500).json({ message: 'Add asset failed' });
  }
});

// Delete asset
router.delete('/portfolio-assets/:assetId', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { assetId } = req.params;

    const [chk] = await exec(
      `SELECT pa.id
         FROM portfolio_assets pa
         JOIN portfolios p ON p.id = pa.portfolio_id
        WHERE pa.id = ? AND p.user_id = ?`,
      [assetId, uid]
    );
    if (!chk.length) return res.status(404).json({ message: 'Not found or unauthorized' });

    await exec('DELETE FROM portfolio_assets WHERE id = ?', [assetId]);
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    console.error('DELETE ASSET ERROR:', err);
    res.status(500).json({ message: 'Delete asset failed' });
  }
});

/* ----------------------- READ ONE & UPDATE/DELETE ------------------------ */

// READ ONE (owner-only)
router.get('/:id', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { id } = req.params;
    const owns = await ensurePortfolioOwner(id, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const [rows] = await exec(
      `SELECT p.id, p.title, p.subtitle, p.bio, p.slug, p.is_public, p.created_at, p.updated_at,
              (SELECT url FROM portfolio_assets WHERE portfolio_id = p.id ORDER BY id DESC LIMIT 1) AS url
         FROM portfolios p
        WHERE p.id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Portfolio not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('READ PORTFOLIO BY ID ERROR:', err);
    res.status(500).json({ message: 'Fetch portfolio failed' });
  }
});

// UPDATE (owner-only)
router.put('/:id', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { id } = req.params;
    const owns = await ensurePortfolioOwner(id, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const fields = ['title','subtitle','bio','slug','is_public'];
    const sets = [];
    const params = [];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === 'is_public') {
          sets.push('is_public = ?');
          params.push(Number(req.body[f] ? 1 : 0));
        } else if (f === 'title') {
          sets.push('title = ?'); params.push(String(req.body[f]).trim().slice(0, 120));
        } else if (f === 'slug') {
          sets.push('slug = ?'); params.push(String(req.body[f]).trim().slice(0, 120));
        } else if (f === 'subtitle' && req.body[f] !== null) {
          sets.push('subtitle = ?'); params.push(String(req.body[f]).slice(0, 200));
        } else {
          sets.push(`${f} = ?`); params.push(req.body[f]);
        }
      }
    }

    if (!sets.length) return res.json({ message: 'Nothing to update' });

    const sql = `UPDATE portfolios SET ${sets.join(', ')} WHERE id = ?`;
    params.push(id);

    await exec(sql, params);
    res.json({ message: 'Portfolio updated' });
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY')     return res.status(409).json({ message: 'Slug already in use for this user' });
    if (err?.code === 'ER_DATA_TOO_LONG') return res.status(422).json({ message: 'One or more fields exceed maximum length' });
    console.error('UPDATE PORTFOLIO ERROR:', err);
    res.status(500).json({ message: 'Update portfolio failed' });
  }
});

// DELETE (owner-only)
router.delete('/:id', verifyAccess, async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ message: 'Invalid token payload' });

    const { id } = req.params;
    const owns = await ensurePortfolioOwner(id, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    await exec('DELETE FROM portfolios WHERE id = ?', [id]);
    res.json({ message: 'Portfolio deleted' });
  } catch (err) {
    console.error('DELETE PORTFOLIO ERROR:', err);
    res.status(500).json({ message: 'Delete portfolio failed' });
  }
});

module.exports = router;
