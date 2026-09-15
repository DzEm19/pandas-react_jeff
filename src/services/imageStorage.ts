import { supabase } from './supabase';

export type ImageRecord = {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    dni: string;
    phone: string;
    label: string;
    image: string;
    date: string;
};

type ImageRecordRow = {
    id: string;
    name?: string;
    first_name: string;
    last_name: string;
    age: number;
    dni: string;
    phone: string;
    label: string;
    image_url: string;
    created_at: string;
};

const BUCKET = 'face-images';
const TABLE = 'face_records';

const requireSupabase = () => {
    if (!supabase) {
        throw new Error('Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
    }
    return supabase;
};

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const response = await fetch(dataUrl);
    return response.blob();
};

const toImageRecord = (row: ImageRecordRow): ImageRecord => ({
    id: row.id,
    firstName: row.first_name || row.name?.split(' ')[0] || '',
    lastName: row.last_name || row.name?.split(' ').slice(1).join(' ') || '',
    age: row.age ?? 0,
    dni: row.dni || '',
    phone: row.phone || '',
    label: row.label,
    image: row.image_url,
    date: new Date(row.created_at).toLocaleString('es-ES'),
});

export const loadImageRecords = async (): Promise<ImageRecord[]> => {
    const client = requireSupabase();
    const { data, error } = await client
        .from(TABLE)
        .select('id, name, first_name, last_name, age, dni, phone, label, image_url, created_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ImageRecordRow[]).map(toImageRecord);
};

export const saveImageRecord = async (record: {
    firstName: string;
    lastName: string;
    age: number;
    dni: string;
    phone: string;
    label: string;
    image: string;
}): Promise<ImageRecord> => {
    const client = requireSupabase();
    const imageBlob = await dataUrlToBlob(record.image);
    const filePath = `${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await client.storage.from(BUCKET).upload(filePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false,
    });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = client.storage.from(BUCKET).getPublicUrl(filePath);
    const { data, error } = await client
        .from(TABLE)
        .insert({
            first_name: record.firstName,
            last_name: record.lastName,
            name: `${record.firstName} ${record.lastName}`.trim(),
            age: record.age,
            dni: record.dni,
            phone: record.phone,
            label: record.label,
            image_url: publicUrlData.publicUrl,
            image_path: filePath,
        })
        .select('id, name, first_name, last_name, age, dni, phone, label, image_url, created_at')
        .single();

    if (error) throw error;
    return toImageRecord(data as ImageRecordRow);
};

export const findRegisteredLabel = async (label: string): Promise<ImageRecord | null> => {
    const client = requireSupabase();
    const { data, error } = await client
        .from(TABLE)
        .select('id, name, first_name, last_name, age, dni, phone, label, image_url, created_at')
        .eq('label', label)
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data ? toImageRecord(data as ImageRecordRow) : null;
};