const express = require('express');
const router = express.Router();
const db = require('../config/db');          // mysql2/promise pool/conn
const { verifyAccess } = require('../middleware/authMiddleware');  // ✅ use the correct middleware

// ---------- helpers ----------
const asJSON = (obj) => {
  try { return JSON.stringify(obj ?? {}); } catch { return '{}'; }
};

async function ensurePortfolioOwner(portfolioId, userId) {
  const [rows] = await db.execute(
    'SELECT id FROM portfolios WHERE id = ? AND user_id = ?',
    [portfolioId, userId]
  );
  return rows.length > 0;
}

async function ensureItemOwner(itemId, userId) {
  const [rows] = await db.execute(
    `SELECT pi.id
     FROM portfolio_items pi
     JOIN portfolios p ON p.id = pi.portfolio_id
     WHERE pi.id = ? AND p.user_id = ?`,
    [itemId, userId]
  );
  return rows.length > 0;
}

// ========== PORTFOLIOS CRUD ==========

// Create portfolio
// body: { title, subtitle, bio, slug, is_public }
router.post('/', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { title, subtitle = null, bio = null, slug, is_public = 0 } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ message: 'title and slug are required' });
    }

    const sql = `
      INSERT INTO portfolios (user_id, title, subtitle, bio, slug, is_public)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [uid, title, subtitle, bio, slug, Number( is_public ? 1 : 0 )]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Slug already in use for this user' });
    }
    console.error(err);
    res.status(500).json({ message: 'Create portfolio failed' });
  }
});

// Get all portfolios for current user
router.get('/me', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const [rows] = await db.execute(
      `SELECT id, title, subtitle, bio, slug, is_public, created_at, updated_at
       FROM portfolios WHERE user_id = ? ORDER BY created_at DESC`,
      [uid]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fetch portfolios failed' });
  }
});

// Public fetch by slug
router.get('/p/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const [rows] = await db.execute(
      `SELECT id, user_id, title, subtitle, bio, slug, is_public, created_at, updated_at
       FROM portfolios WHERE slug = ? AND is_public = 1`,
      [slug]
    );
    if (!rows.length) return res.status(404).json({ message: 'Portfolio not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fetch portfolio failed' });
  }
});

// Update portfolio
// body: { title?, subtitle?, bio?, slug?, is_public? }
router.put('/:id', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { id } = req.params;
    const owns = await ensurePortfolioOwner(id, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const fields = ['title','subtitle','bio','slug','is_public'];
    const sets = [];
    const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === 'is_public') {
          sets.push(`${f} = ?`);
          params.push(Number(req.body[f] ? 1 : 0));
        } else {
          sets.push(`${f} = ?`);
          params.push(req.body[f]);
        }
      }
    }
    if (!sets.length) return res.json({ message: 'Nothing to update' });

    const sql = `UPDATE portfolios SET ${sets.join(', ')} WHERE id = ?`;
    params.push(id);

    await db.execute(sql, params);
    res.json({ message: 'Portfolio updated' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Slug already in use for this user' });
    }
    console.error(err);
    res.status(500).json({ message: 'Update portfolio failed' });
  }
});

// Delete portfolio (cascades to items/images/links/assets)
router.delete('/:id', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { id } = req.params;
    const owns = await ensurePortfolioOwner(id, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    await db.execute('DELETE FROM portfolios WHERE id = ?', [id]);
    res.json({ message: 'Portfolio deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete portfolio failed' });
  }
});

// ========== PORTFOLIO ITEMS CRUD (Add/Edit/Delete) ==========

// Create item
// body: { portfolio_id, title, description?, category?, tech_stack?, meta?, order_index? }
router.post('/portfolio-items', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const {
      portfolio_id,
      title,
      description = null,
      category = null,
      tech_stack = null,
      meta = {},
      order_index = 0
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
    const [result] = await db.execute(sql, [
      portfolio_id, uid, title, description, category, tech_stack, asJSON(meta), order_index
    ]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Create item failed' });
  }
});

// Read items for a portfolio
router.get('/:portfolioId/items', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { portfolioId } = req.params;
    const owns = await ensurePortfolioOwner(portfolioId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const [rows] = await db.execute(
      `SELECT id, portfolio_id, user_id, title, description, category, tech_stack, meta, order_index,
              created_at, updated_at
       FROM portfolio_items
       WHERE portfolio_id = ?
       ORDER BY order_index ASC, created_at DESC`,
      [portfolioId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fetch items failed' });
  }
});

// Read single item
router.get('/portfolio-items/:itemId', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { itemId } = req.params;
    const owns = await ensureItemOwner(itemId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const [rows] = await db.execute(
      `SELECT id, portfolio_id, user_id, title, description, category, tech_stack, meta, order_index,
              created_at, updated_at
       FROM portfolio_items WHERE id = ?`,
      [itemId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fetch item failed' });
  }
});

// Update item
// body: any subset of { title, description, category, tech_stack, meta, order_index }
router.put('/portfolio-items/:itemId', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
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
        } else {
          sets.push(`${key} = ?`);
          params.push(req.body[key]);
        }
      }
    }
    if (!sets.length) return res.json({ message: 'Nothing to update' });

    const sql = `UPDATE portfolio_items SET ${sets.join(', ')} WHERE id = ?`;
    params.push(itemId);
    await db.execute(sql, params);
    res.json({ message: 'Item updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update item failed' });
  }
});

// Delete item (cascades images/links via FK)
router.delete('/portfolio-items/:itemId', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { itemId } = req.params;
    const owns = await ensureItemOwner(itemId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    await db.execute('DELETE FROM portfolio_items WHERE id = ?', [itemId]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete item failed' });
  }
});

// ========== OPTIONAL: LINKS ==========

// Add link
// body: { label, url, link_type?, order_index? }
router.post('/portfolio-items/:itemId/links', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { itemId } = req.params;
    const owns = await ensureItemOwner(itemId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const { label, url, link_type = null, order_index = 0 } = req.body;
    if (!label || !url) return res.status(400).json({ message: 'label and url are required' });

    const [result] = await db.execute(
      `INSERT INTO portfolio_links (item_id, label, url, link_type, order_index)
       VALUES (?, ?, ?, ?, ?)`,
      [itemId, label, url, link_type, order_index]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Add link failed' });
  }
});

router.put('/portfolio-links/:linkId', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { linkId } = req.params;

    // ownership via join back to item/portfolio/user
    const [chk] = await db.execute(
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
    if (label !== undefined) { sets.push('label = ?'); params.push(label); }
    if (url !== undefined) { sets.push('url = ?'); params.push(url); }
    if (link_type !== undefined) { sets.push('link_type = ?'); params.push(link_type); }
    if (order_index !== undefined) { sets.push('order_index = ?'); params.push(order_index); }
    if (!sets.length) return res.json({ message: 'Nothing to update' });

    params.push(linkId);
    await db.execute(`UPDATE portfolio_links SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Link updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update link failed' });
  }
});

router.delete('/portfolio-links/:linkId', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { linkId } = req.params;
    const [chk] = await db.execute(
      `SELECT pl.id
       FROM portfolio_links pl
       JOIN portfolio_items pi ON pi.id = pl.item_id
       JOIN portfolios p ON p.id = pi.portfolio_id
       WHERE pl.id = ? AND p.user_id = ?`,
      [linkId, uid]
    );
    if (!chk.length) return res.status(404).json({ message: 'Not found or unauthorized' });

    await db.execute('DELETE FROM portfolio_links WHERE id = ?', [linkId]);
    res.json({ message: 'Link deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete link failed' });
  }
});

// ========== OPTIONAL: IMAGES (assumes you already uploaded and have a URL) ==========

// Add image
// body: { url, alt_text?, order_index? }
router.post('/portfolio-items/:itemId/images', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { itemId } = req.params;
    const owns = await ensureItemOwner(itemId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const { url, alt_text = null, order_index = 0 } = req.body;
    if (!url) return res.status(400).json({ message: 'url is required' });

    const [result] = await db.execute(
      `INSERT INTO portfolio_images (item_id, url, alt_text, order_index)
       VALUES (?, ?, ?, ?)`,
      [itemId, url, alt_text, order_index]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Add image failed' });
  }
});

router.delete('/portfolio-images/:imageId', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { imageId } = req.params;

    const [chk] = await db.execute(
      `SELECT pi.id
       FROM portfolio_images pi
       JOIN portfolio_items it ON it.id = pi.item_id
       JOIN portfolios p ON p.id = it.portfolio_id
       WHERE pi.id = ? AND p.user_id = ?`,
      [imageId, uid]
    );
    if (!chk.length) return res.status(404).json({ message: 'Not found or unauthorized' });

    await db.execute('DELETE FROM portfolio_images WHERE id = ?', [imageId]);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete image failed' });
  }
});

// ========== OPTIONAL: ASSETS (link/upload a full portfolio) ==========

// body: { asset_type: 'external'|'upload', url, label? }
router.post('/:portfolioId/assets', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { portfolioId } = req.params;
    const owns = await ensurePortfolioOwner(portfolioId, uid);
    if (!owns) return res.status(404).json({ message: 'Not found or unauthorized' });

    const { asset_type, url, label = null } = req.body;
    if (!asset_type || !url) return res.status(400).json({ message: 'asset_type and url are required' });

    const [result] = await db.execute(
      `INSERT INTO portfolio_assets (portfolio_id, asset_type, url, label)
       VALUES (?, ?, ?, ?)`,
      [portfolioId, asset_type, url, label]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Add asset failed' });
  }
});

router.delete('/portfolio-assets/:assetId', verifyAccess, async (req, res) => {
  try {
    const uid = req.user.id;
    const { assetId } = req.params;

    const [chk] = await db.execute(
      `SELECT pa.id
       FROM portfolio_assets pa
       JOIN portfolios p ON p.id = pa.portfolio_id
       WHERE pa.id = ? AND p.user_id = ?`,
      [assetId, uid]
    );
    if (!chk.length) return res.status(404).json({ message: 'Not found or unauthorized' });

    await db.execute('DELETE FROM portfolio_assets WHERE id = ?', [assetId]);
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete asset failed' });
  }
});

module.exports = router;
