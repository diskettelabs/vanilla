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

function typeCategory(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType === 'application/pdf') return 'pdf';
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const cat = typeCategory(file.mimetype);
    if (!cat) return cb(new Error(`Unsupported file type: ${file.mimetype}`));
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

  const ext = path.extname(file.originalname) || '.bin';
  const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}${ext}`;
  const destPath = path.join(UPLOAD_DIR, uniqueName);

  let buf = file.buffer;

  if (IMAGE_MIME.includes(file.mimetype)) {
    try {
      buf = await sharp(buf)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch {
      // fall through with original
    }
  }

  await fs.promises.writeFile(destPath, buf);

  return {
    url: `/uploads/${uniqueName}`,
    name: file.originalname,
    size: buf.length,
    type: file.mimetype,
  };
}

module.exports = { upload, processUpload, UPLOAD_DIR };
