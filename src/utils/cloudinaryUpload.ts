import { UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary';

export const uploadToCloudinary = (
    file: Express.Multer.File,
    folder = 'digo/articles'
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (!result) {
                    reject(
                        new Error(
                            'Cloudinary upload returned no result'
                        )
                    );
                } else {
                    resolve(result);
                }
            }
        );

        streamifier
            .createReadStream(file.buffer)
            .pipe(uploadStream);
    });
};