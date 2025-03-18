import QRCode from 'qrcode';
import sharp from 'sharp';
import axios from 'axios';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { CHAIN_INFO } from './chain.utils';
import logger from './logger.utils';
import * as fs from 'fs';

/**
 * Generates a QR code with the network logo in the center
 * @param address Wallet address to encode in QR code
 * @param chainId Chain ID to get the logo from
 * @returns Path to the generated QR code image
 */
export async function generateQRCodeWithLogo(address: string, chainId: string): Promise<string> {
    try {
        // Get chain info to retrieve logo
        const chainInfo = CHAIN_INFO[chainId as keyof typeof CHAIN_INFO];
        const logoUrl = chainInfo?.logoUrl || 'https://chainlist.org/unknown-logo.png';

        // Create a temp file path for the QR code
        const qrPath = join(tmpdir(), `qrcode-${uuidv4()}.png`);
        const tempQrPath = join(tmpdir(), `temp-qrcode-${uuidv4()}.png`);

        // Generate a simple QR code using qrcode library first
        await QRCode.toFile(tempQrPath, address, {
            errorCorrectionLevel: 'H',  // High error correction to accommodate logo
            margin: 1,
            width: 375,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        // Prepare the logo - download it first if it exists
        let logoBuffer: Buffer | null = null;

        try {
            // Download logo
            const response = await axios.get(logoUrl, {
                responseType: 'arraybuffer',
                timeout: 5000 // Add timeout to prevent hanging
            });
            logoBuffer = Buffer.from(response.data);
        } catch (logoError) {
            logger.warn('Error downloading logo, proceeding without logo', { logoError });
            // Continue without logo if there's an error
        }

        if (logoBuffer) {
            // Read the QR code image
            const qrImage = sharp(tempQrPath);
            const metadata = await qrImage.metadata();

            if (!metadata.width) {
                throw new Error('Failed to get QR image dimensions');
            }

            const logoSize = Math.round(metadata.width * 0.1);
            const whiteSquareSize = Math.round(logoSize * 1.5);

            const resizedLogo = await sharp(logoBuffer)
                .resize(logoSize, logoSize, { fit: 'inside' })
                .toBuffer();

            const whiteSquare = await sharp({
                create: {
                    width: whiteSquareSize,
                    height: whiteSquareSize,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            }).png().toBuffer();

            const logoOnSquarePosition = {
                left: Math.round((whiteSquareSize - logoSize) / 2),
                top: Math.round((whiteSquareSize - logoSize) / 2)
            };

            const logoWithBackground = await sharp(whiteSquare)
                .composite([{
                    input: resizedLogo,
                    left: logoOnSquarePosition.left,
                    top: logoOnSquarePosition.top
                }])
                .toBuffer();

            const squarePosition = {
                left: Math.round((metadata.width - whiteSquareSize) / 2),
                top: Math.round((metadata.width - whiteSquareSize) / 2)
            };

            // Composite logo onto QR code
            await sharp(tempQrPath)
                .composite([{
                    input: logoWithBackground,
                    left: squarePosition.left,
                    top: squarePosition.top
                }])
                .toFile(qrPath);

            // Clean up temp file
            try {
                fs.unlinkSync(tempQrPath);
            } catch (cleanupError) {
                logger.warn('Error cleaning up temporary QR code file', { cleanupError });
            }
        } else {
            // Just use the original QR code if we couldn't get a logo
            fs.renameSync(tempQrPath, qrPath);
        }

        return qrPath;
    } catch (error) {
        logger.error('Error generating QR code with logo', { error });
        // If there's an error, fall back to simple QR code generation
        return await generateSimpleQRCode(address);
    }
}

/**
 * Generates a simple QR code without a logo
 * @param data Data to encode in QR code
 * @returns Path to the generated QR code image
 */
export async function generateSimpleQRCode(data: string): Promise<string> {
    try {
        const qrPath = join(tmpdir(), `qrcode-simple-${uuidv4()}.png`);
        await QRCode.toFile(qrPath, data, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 375,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        return qrPath;
    } catch (error) {
        logger.error('Error generating simple QR code', { error });
        throw new Error('Failed to generate QR code');
    }
} 