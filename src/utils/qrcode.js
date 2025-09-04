import QRCode from "qrcode";

export async function generateQRCode(text, options = {}) {
    const defaultOptions = {
        type: "png",
        width: 300,
        margin: 2,
        color: {
            dark: "#000000",
            light: "#FFFFFF"
        },
        errorCorrectionLevel: "M"
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
        return await QRCode.toBuffer(text, finalOptions);
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        throw new Error('Falha ao gerar QR Code');
    }
} 