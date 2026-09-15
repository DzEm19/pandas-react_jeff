import type { ImageRecord } from './imageStorage';

type RecognitionResponse = {
    authorized: boolean;
    authorized_probability: number;
    unauthorized_probability: number;
    record: ImageRecord | null;
};

export const recognizeFace = async (image: string): Promise<RecognitionResponse> => {
    const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(body?.detail ?? 'No se pudo conectar con DeepFace.');
    }

    const result = await response.json() as {
        authorized: boolean;
        authorized_probability: number;
        unauthorized_probability: number;
        record: {
            id: string;
            first_name: string;
            last_name: string;
            age: number;
            dni: string;
            phone: string;
            label: string;
            image_url: string;
            created_at: string;
        } | null;
    };

    return {
        authorized: result.authorized,
        authorized_probability: result.authorized_probability,
        unauthorized_probability: result.unauthorized_probability,
        record: result.record ? {
            id: result.record.id,
            firstName: result.record.first_name,
            lastName: result.record.last_name,
            age: result.record.age,
            dni: result.record.dni,
            phone: result.record.phone,
            label: result.record.label,
            image: result.record.image_url,
            date: new Date(result.record.created_at).toLocaleString('es-ES'),
        } : null,
    };
};