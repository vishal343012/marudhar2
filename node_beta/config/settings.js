const allowedFileTypes = {
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".rtf": "application/rtf",
  ".csv": "text/csv",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".xls": "application/vnd.ms-excel",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".mpeg": "video/mpeg",
  ".doc": "text/msword",
  ".ppt": "application/vnd.ms-powerpoint",
};

const disallowedFileTypes = {
  ".rar": "application/vnd.rar",
  ".sh ": "application/-sh",
  ".bin": "application/octet-stream",
  ".csh ": "application/x-csh",
  ".jar": "application/java-archieve",
  ".json": "application/json",
  ".tar": "application/x-tar",
  ".zip": "application/zip",
  ".mjs": "text/javascript",
};

module.exports = { allowedFileTypes, disallowedFileTypes };
