export type SavedAudio = {
    id: string;
    name: string;
    createdAt: string;
    duration: number;
    blob: Blob;
};

const DATABASE_NAME = 'pandas-react-audio';
const STORE_NAME = 'recordings';

const openAudioDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento de audio.'));
});

export const loadSavedAudios = async (): Promise<SavedAudio[]> => {
    const database = await openAudioDatabase();
    return new Promise((resolve, reject) => {
        const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
        request.onsuccess = () => {
            database.close();
            resolve((request.result as SavedAudio[]).sort((first, second) => second.createdAt.localeCompare(first.createdAt)));
        };
        request.onerror = () => {
            database.close();
            reject(request.error ?? new Error('No se pudieron cargar los audios guardados.'));
        };
    });
};

export const saveAudio = async (audio: SavedAudio): Promise<void> => {
    const database = await openAudioDatabase();
    return new Promise((resolve, reject) => {
        const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(audio);
        request.onsuccess = () => {
            database.close();
            resolve();
        };
        request.onerror = () => {
            database.close();
            reject(request.error ?? new Error('No se pudo guardar el audio.'));
        };
    });
};

export const deleteAudio = async (id: string): Promise<void> => {
    const database = await openAudioDatabase();
    return new Promise((resolve, reject) => {
        const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
        request.onsuccess = () => {
            database.close();
            resolve();
        };
        request.onerror = () => {
            database.close();
            reject(request.error ?? new Error('No se pudo eliminar el audio.'));
        };
    });
};
