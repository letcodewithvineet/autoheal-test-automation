import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';

let bucket: GridFSBucket | null = null;

function getGridFSBucket(): GridFSBucket {
  if (!bucket) {
    if (!mongoose.connection.db) {
      throw new Error('MongoDB connection not established');
    }
    bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'autoheal_artifacts'
    });
  }
  return bucket;
}

export async function saveFileToGridFS(
  filePath: string, 
  filename: string, 
  contentType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: { 
          contentType,
          uploadedAt: new Date(),
          originalPath: filePath
        }
      });

      const readStream = fs.createReadStream(filePath);

      uploadStream.on('finish', () => {
        // Clean up the temporary file
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.warn(`Failed to delete temporary file ${filePath}:`, err);
          }
        });
        
        resolve(uploadStream.id.toString());
      });

      uploadStream.on('error', (error) => {
        logger.error('GridFS upload error:', error);
        reject(error);
      });

      readStream.on('error', (error) => {
        logger.error('File read error:', error);
        reject(error);
      });

      readStream.pipe(uploadStream);

    } catch (error) {
      logger.error('Error setting up GridFS upload:', error);
      reject(error);
    }
  });
}

export async function getFileFromGridFS(fileId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
      
      const chunks: Buffer[] = [];

      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      downloadStream.on('error', (error) => {
        logger.error('GridFS download error:', error);
        reject(error);
      });

    } catch (error) {
      logger.error('Error setting up GridFS download:', error);
      reject(error);
    }
  });
}

export async function getFileStreamFromGridFS(fileId: string): Promise<NodeJS.ReadableStream> {
  try {
    const bucket = getGridFSBucket();
    return bucket.openDownloadStream(new ObjectId(fileId));
  } catch (error) {
    logger.error('Error creating GridFS download stream:', error);
    throw error;
  }
}

export async function deleteFileFromGridFS(fileId: string): Promise<void> {
  try {
    const bucket = getGridFSBucket();
    await bucket.delete(new ObjectId(fileId));
    logger.info(`Deleted file from GridFS: ${fileId}`);
  } catch (error) {
    logger.error('Error deleting file from GridFS:', error);
    throw error;
  }
}

export async function getFileMetadata(fileId: string): Promise<any> {
  try {
    const bucket = getGridFSBucket();
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    
    if (files.length === 0) {
      throw new Error(`File not found: ${fileId}`);
    }
    
    return files[0];
  } catch (error) {
    logger.error('Error getting file metadata:', error);
    throw error;
  }
}

export async function saveBufferToGridFS(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata?: any
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          contentType,
          uploadedAt: new Date(),
          ...metadata
        }
      });

      uploadStream.on('finish', () => {
        resolve(uploadStream.id.toString());
      });

      uploadStream.on('error', (error) => {
        logger.error('GridFS buffer upload error:', error);
        reject(error);
      });

      uploadStream.end(buffer);

    } catch (error) {
      logger.error('Error setting up GridFS buffer upload:', error);
      reject(error);
    }
  });
}

export async function listFiles(filter?: any): Promise<any[]> {
  try {
    const bucket = getGridFSBucket();
    return await bucket.find(filter || {}).toArray();
  } catch (error) {
    logger.error('Error listing GridFS files:', error);
    throw error;
  }
}

export async function getFileStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  oldestFile?: Date;
  newestFile?: Date;
}> {
  try {
    const files = await listFiles();
    
    if (files.length === 0) {
      return { totalFiles: 0, totalSize: 0 };
    }

    const totalSize = files.reduce((sum, file) => sum + file.length, 0);
    const uploadDates = files.map(file => file.uploadDate).sort();

    return {
      totalFiles: files.length,
      totalSize,
      oldestFile: uploadDates[0],
      newestFile: uploadDates[uploadDates.length - 1]
    };
  } catch (error) {
    logger.error('Error getting file stats:', error);
    throw error;
  }
}
