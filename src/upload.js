const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const sharp = require('sharp');
const { FileError } = require('./errors');

// Resolve relative to cwd: the packaged app chdir()s to the user data dir,
// so uploads land in userData/data/uploads instead of the read-only bundle.
const UPLOAD_DIR = path.resolve('data', 'uploads');

const TYPE_LIMITS = {
  image: 5 * 1024 * 1024,
  text: 2 * 1024 * 1024,
  pdf: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

const VIDEO_MIME = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/x-msvideo',
];

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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
};

function typeCategory(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (TEXT_TYPES.includes(mimeType)) return 'text';
  if (mimeType === 'application/pdf') return 'pdf';
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    let mime = file.mimetype;
    if (mime === 'application/octet-stream') {
      const ext = path.extname(file.originalname).toLowerCase();
      mime = EXT_MAP[ext] || mime;
    }
    const cat = typeCategory(mime);
    if (!cat) {
      const err = new FileError(`Unsupported file type: ${file.mimetype}`, {
        userMessage: 'File type not supported',
        action: `${file.mimetype} files are not allowed. Supported types: images (PNG, JPG, GIF, WebP), videos (MP4, WebM, MOV, MKV), documents (PDF, TXT, MD), and code files.`,
        statusCode: 415,
      });
      return cb(err);
    }
    file.mimetype = mime;
    cb(null, true);
  },
});

async function processUpload(file) {
  const cat = typeCategory(file.mimetype);
  const limit = TYPE_LIMITS[cat];
  
  if (file.size > limit) {
    throw new FileError(`${cat} file exceeds ${limit / 1024 / 1024}MB limit`, {
      userMessage: 'File is too large',
      action: `Maximum ${cat} file size is ${limit / 1024 / 1024}MB. Compress or resize your file and try again.`,
      statusCode: 413,
    });
  }

  let safeExt = path.extname(file.originalname) || '.bin';
  const safeBase = path.basename(file.originalname, safeExt).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  let buf = file.buffer;

  // Process images (videos and documents are stored as-is)
  if (cat === 'image' && file.mimetype !== 'image/gif') {
    try {
      buf = await sharp(buf)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      safeExt = '.jpg';
    } catch (imageError) {
      throw new FileError('Failed to process image', {
        userMessage: 'Image processing failed',
        action: 'The image file may be corrupted. Try a different image or check the file format.',
        statusCode: 400,
        details: imageError.message,
      });
    }
  }

  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}${safeExt}`;
  const destPath = path.join(UPLOAD_DIR, uniqueName);

  // Ensure upload directory exists
  try {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (dirError) {
    throw new FileError('Failed to create upload directory', {
      userMessage: 'Upload directory unavailable',
      action: 'The server cannot create the upload directory. Contact your administrator.',
      statusCode: 500,
      details: dirError.message,
    });
  }

  // Write file
  try {
    await fs.promises.writeFile(destPath, buf);
  } catch (writeError) {
    throw new FileError('Failed to save file', {
      userMessage: 'Failed to save uploaded file',
      action: 'Check that the server has sufficient disk space and write permissions.',
      statusCode: 500,
      details: writeError.message,
    });
  }

  // Ensure filename is properly encoded for JSON response
  const cleanName = Buffer.from(file.originalname, 'latin1').toString('utf8');

  return {
    url: `/uploads/${uniqueName}`,
    name: cleanName,
    size: buf.length,
    type: file.mimetype,
  };
}

module.exports = { upload, processUpload, UPLOAD_DIR };
