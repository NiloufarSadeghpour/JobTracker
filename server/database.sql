CREATE DATABASE jobtracker;
USE jobtracker;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,             -- e.g. "Frontend Developer"
  company VARCHAR(255) NOT NULL,           -- e.g. "Google"
  location VARCHAR(255),                   -- e.g. "New York, NY" or "Remote"
  job_link VARCHAR(2083),                  -- URL to job listing (2083 is the max URL length in practice)
  status ENUM('Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected') DEFAULT 'Wishlist',
  deadline DATE,                           -- Application deadline
  tags VARCHAR(255),                       -- Comma-separated e.g. "remote,frontend,internship"
  notes TEXT,                              
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE jobs
ADD COLUMN date_applied DATE;

-- Insert dummy job applications (user_id = 1)
INSERT INTO jobs (user_id, company, title, status, date_applied)
VALUES
  (1, 'Google', 'Frontend Developer', 'Applied', '2025-07-01'),
  (1, 'Spotify', 'UX Designer', 'Interview', '2025-06-25'),
  (1, 'Amazon', 'Software Engineer', 'Rejected', '2025-06-15');
ALTER TABLE users
ADD COLUMN resume_path VARCHAR(255) DEFAULT NULL;
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('job', 'company', 'field') NOT NULL,
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Top-level portfolio container (a user can have multiple)
CREATE TABLE portfolios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,          
  subtitle VARCHAR(200),
  bio TEXT,
  slug VARCHAR(120) NOT NULL,           
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_portfolios_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- A user can’t reuse the same slug across their own portfolios
  CONSTRAINT uq_portfolios_user_slug UNIQUE (user_id, slug)
);

-- Items that appear on a portfolio page
CREATE TABLE portfolio_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  portfolio_id INT NOT NULL,
  user_id INT NOT NULL,                  -- redundancy for quick ownership checks
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(60),                  -- e.g., Tech, Design, Architecture, Research, Writing, Music, Business
  tech_stack TEXT,                       -- optional: free text or CSV; keep for convenience
  meta JSON NULL,                        -- category-specific fields (e.g., {"figma":"...","paperUrl":"..."})
  order_index INT NOT NULL DEFAULT 0,    -- sort within portfolio
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_items_portfolio
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,

  CONSTRAINT fk_items_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_items_portfolio_order (portfolio_id, order_index),
  INDEX idx_items_user_category (user_id, category)
);

-- Multiple images per item
CREATE TABLE portfolio_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  url VARCHAR(512) NOT NULL,             -- stored URL (S3/local)
  alt_text VARCHAR(200),
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_images_item
    FOREIGN KEY (item_id) REFERENCES portfolio_items(id) ON DELETE CASCADE,

  INDEX idx_images_item_order (item_id, order_index)
);

-- Generic links per item (not tech-biased)
-- Examples: GitHub, Demo, Figma, Behance, Dribbble, ResearchGate, arXiv, Paper, Dataset, YouTube, Spotify, etc.
CREATE TABLE portfolio_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  label VARCHAR(80) NOT NULL,            -- what users see (e.g., "Figma", "Paper", "Demo")
  url VARCHAR(512) NOT NULL,
  link_type VARCHAR(40),                 -- optional machine-friendly type (e.g., 'figma','github','paper','video','other')
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_links_item
    FOREIGN KEY (item_id) REFERENCES portfolio_items(id) ON DELETE CASCADE,

  INDEX idx_links_item_order (item_id, order_index)
);

-- External or uploaded full-portfolio artifacts (PDF/ZIP/Notion/etc.)
CREATE TABLE portfolio_assets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  portfolio_id INT NOT NULL,
  asset_type ENUM('external','upload') NOT NULL,
  url VARCHAR(512) NOT NULL,             -- external URL or uploaded file URL
  label VARCHAR(100),                    -- e.g., "Full PDF Portfolio", "Notion Portfolio"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_assets_portfolio
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX idx_portfolios_user_public ON portfolios(user_id, is_public);
CREATE INDEX idx_portfolios_slug ON portfolios(slug);

USE jobtracker;

ALTER TABLE users
  ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER password,
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role;

CREATE INDEX idx_users_role_active ON users(role, is_active);

-- Admin invite tokens for invite-only flow
CREATE TABLE IF NOT EXISTS admin_invites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  token CHAR(64) NOT NULL UNIQUE,             -- random hex string
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_by INT NULL,                        -- admin user who created the invite (nullable for bootstrap)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invites_email (email),
  CONSTRAINT fk_admin_invites_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
-- Simulate an invite (replace TOKEN_HEX_64 with a real 64-char hex string)
INSERT INTO admin_invites (email, token, expires_at, created_by)
VALUES ('new.admin@example.com', '<PASTE_HEX>', DATE_ADD(NOW(), INTERVAL 1 DAY), NULL);

SELECT * FROM admin_invites ORDER BY id DESC LIMIT 1;
-- set your own email here
UPDATE users SET role='admin', is_active=1 WHERE email='mjj.mylife@yahoo.com';
-- Admin announcements (broadcasts to admins)
CREATE TABLE IF NOT EXISTS admin_announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  CONSTRAINT fk_admin_annc_user
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_annc_expires (expires_at),
  INDEX idx_annc_created (created_at)
);

-- Per-admin read receipts
CREATE TABLE IF NOT EXISTS admin_announcement_reads (
  announcement_id INT NOT NULL,
  admin_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (announcement_id, admin_id),
  CONSTRAINT fk_annc_reads_annc
    FOREIGN KEY (announcement_id) REFERENCES admin_announcements(id) ON DELETE CASCADE,
  CONSTRAINT fk_annc_reads_admin
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reads_admin (admin_id)
);

-- Contextual notes (on user/job/portfolio)
CREATE TABLE IF NOT EXISTS admin_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','job','portfolio') NOT NULL,
  entity_id INT NOT NULL,
  admin_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_admin
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notes_entity (entity_type, entity_id),
  INDEX idx_notes_admin (admin_id)
);
-- required columns
DESCRIBE users;
-- expect: role ENUM('user','admin'), is_active TINYINT(1)

SHOW TABLES LIKE 'admin_invites';
SHOW TABLES LIKE 'admin_announcements';
SHOW TABLES LIKE 'admin_announcement_reads';
SHOW TABLES LIKE 'admin_notes';

-- smoke data
SELECT id, email, role, is_active FROM users WHERE email IN ('mjj.mylife@yahoo.com');
SELECT * FROM admin_invites ORDER BY id DESC LIMIT 3;

CREATE TABLE IF NOT EXISTS contact_messages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(256) NOT NULL,
  subject     VARCHAR(150) NOT NULL,
  message     TEXT NOT NULL,
  ip          VARCHAR(64),
  user_agent  TEXT,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE portfolio_items
  ADD CONSTRAINT fk_items_portfolio
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;

ALTER TABLE portfolio_links
  ADD CONSTRAINT fk_links_item
  FOREIGN KEY (item_id) REFERENCES portfolio_items(id) ON DELETE CASCADE;

ALTER TABLE portfolio_images
  ADD CONSTRAINT fk_images_item
  FOREIGN KEY (item_id) REFERENCES portfolio_items(id) ON DELETE CASCADE;

ALTER TABLE portfolio_assets
  ADD CONSTRAINT fk_assets_portfolio
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',   
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link VARCHAR(255),                          
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_read (user_id, is_read),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

ALTER TABLE notifications
  ADD COLUMN kind VARCHAR(64) NULL,
  ADD INDEX idx_notifications_kind (kind);
