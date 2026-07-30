const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const sharp = require('sharp');

const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');

const TYPE_LIMITS = {
  image: 5 * 1024 * 1024,
  text: 2 * 1024 * 1024,
  pdf: 10 * 1024 * 1024,
};

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

const TEXT_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
const EXT_MAP = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

function typeCategory(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (TEXT_TYPES.includes(mimeType)) return 'text';
  if (mimeType === 'application/pdf') return 'pdf';
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    let mime = file.mimetype;
    if (mime === 'application/octet-stream') {
      const ext = path.extname(file.originalname).toLowerCase();
      mime = EXT_MAP[ext] || mime;
    }
    const cat = typeCategory(mime);
    if (!cat) return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    file.mimetype = mime;
    cb(null, true);
  },
});

async function processUpload(file) {
  const cat = typeCategory(file.mimetype);
  const limit = TYPE_LIMITS[cat];
  if (file.size > limit) {
    const err = new Error(`${cat} file exceeds ${limit / 1024 / 1024}MB limit`);
    err.statusCode = 413;
    throw err;
  }

  let safeExt = path.extname(file.originalname) || '.bin';
  const safeBase = path.basename(file.originalname, safeExt).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  let buf = file.buffer;

  if (IMAGE_MIME.includes(file.mimetype) && file.mimetype !== 'image/gif') {
    try {
      buf = await sharp(buf)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      safeExt = '.jpg';
    } catch {
      // fall through with original
    }
  }

  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}${safeExt}`;
  const destPath = path.join(UPLOAD_DIR, uniqueName);

  await fs.promises.writeFile(destPath, buf);

  return {
    url: `/uploads/${uniqueName}`,
    name: file.originalname,
    size: buf.length,
    type: file.mimetype,
  };
}

module.exports = { upload, processUpload, UPLOAD_DIR };
