import { useEffect, useRef, useState } from 'react';
import { loadImageRecords, saveImageRecord, type ImageRecord } from '../services/imageStorage';
import { SUPABASE_CONFIGURED } from '../services/supabase';
import { recognizeFace } from '../services/deepfaceApi';
import './ImageModel.css';

<<<<<<< HEAD
const MODEL_URL = '/my_model_image/';
=======
>>>>>>> 133748d (Mensaje para el commit fusionado)
const CAMERA_SIZE = 400;
const RECOGNITION_INTERVAL = 1200;
const getCurrentTime = () => Date.now();
const AUTHORIZED_LABEL = 'persona autorizada';
type AccessStatus = 'idle' | 'checking' | 'allowed' | 'denied' | 'error';
type FacePrediction = { authorized: number; unauthorized: number };

function ImageModel() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const isMountedRef = useRef(true);
    const lastRecognitionTimeRef = useRef(0);
    const isRecognizingRef = useRef(false);

    const [isStarting, setIsStarting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [pendingCapture, setPendingCapture] = useState<{ image: string; label: string } | null>(null);
    const [records, setRecords] = useState<ImageRecord[]>([]);
    const [personData, setPersonData] = useState({ firstName: '', lastName: '', age: '', dni: '', phone: '' });
    const [error, setError] = useState('');
    const [accessStatus, setAccessStatus] = useState<AccessStatus>('idle');
    const [accessRecord, setAccessRecord] = useState<ImageRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [facePrediction, setFacePrediction] = useState<FacePrediction>({ authorized: 0, unauthorized: 0 });

    useEffect(() => {
        isMountedRef.current = true;
        if (SUPABASE_CONFIGURED) {
            void loadImageRecords()
                .then((savedRecords) => {
                    if (isMountedRef.current) setRecords(savedRecords);
                })
                .catch(() => setError('No se pudieron cargar los registros desde Supabase. Revisa la tabla y sus políticas RLS.'));
        }
        return () => {
            isMountedRef.current = false;
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const predict = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !isMountedRef.current) return;

        const now = getCurrentTime();
        const context = canvas.getContext('2d');
        if (context) context.drawImage(video, 0, 0, CAMERA_SIZE, CAMERA_SIZE);
        if (!isRecognizingRef.current && now - lastRecognitionTimeRef.current >= RECOGNITION_INTERVAL) {
            lastRecognitionTimeRef.current = now;
            isRecognizingRef.current = true;
            const image = canvas.toDataURL('image/jpeg', 0.9);
            setAccessStatus('checking');
            void recognizeFace(image).then((result) => {
                if (!isMountedRef.current) return;
                setAccessStatus(result.authorized ? 'allowed' : 'denied');
                setAccessRecord(result.record);
                setFacePrediction({
                    authorized: result.authorized_probability,
                    unauthorized: result.unauthorized_probability,
                });
                if (!result.authorized && !pendingCapture) setPendingCapture({ image, label: AUTHORIZED_LABEL });
            }).catch((recognitionError: unknown) => {
                if (isMountedRef.current) {
                    setAccessStatus('error');
                    setError(recognitionError instanceof Error ? recognitionError.message : 'No se pudo conectar con DeepFace.');
                }
            }).finally(() => {
                isRecognizingRef.current = false;
            });
        }

        animationRef.current = requestAnimationFrame(() => void predict());
    };

    const start = async () => {
        if (isStarting || isActive) return;
        setIsStarting(true);
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: CAMERA_SIZE, height: CAMERA_SIZE, facingMode: 'user' }, audio: false });
            const video = videoRef.current;
            if (!video) throw new Error('No se pudo preparar el elemento de vídeo.');
            streamRef.current = stream;
            video.srcObject = stream;
            await video.play();
            if (!isMountedRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            setIsActive(true);
            setIsStarting(false);
            void predict();
        } catch {
            setIsStarting(false);
            setError('No se pudo iniciar la cámara. Revisa los permisos del navegador.');
        }
    };

    const stop = () => {
        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        isRecognizingRef.current = false;
        setIsActive(false);
        setAccessStatus('idle');
        setAccessRecord(null);
        setFacePrediction({ authorized: 0, unauthorized: 0 });
    };

    const registerCapture = async () => {
        if (!pendingCapture
            || pendingCapture.label.trim().toLowerCase() !== AUTHORIZED_LABEL
            || !personData.firstName.trim()
            || !personData.lastName.trim()
            || !personData.age
            || !personData.dni.trim()
            || !personData.phone.trim()) return;
        setIsSaving(true);
        setError('');
        try {
            const savedRecord = await saveImageRecord({
                firstName: personData.firstName.trim(),
                lastName: personData.lastName.trim(),
                age: Number(personData.age),
                dni: personData.dni.trim(),
                phone: personData.phone.trim(),
                label: pendingCapture.label,
                image: pendingCapture.image,
            });
            setRecords((current) => [savedRecord, ...current]);
            setPendingCapture(null);
            setPersonData({ firstName: '', lastName: '', age: '', dni: '', phone: '' });
            setAccessStatus('allowed');
            setAccessRecord(savedRecord);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo guardar la imagen en Supabase.');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteCapture = () => {
        setPendingCapture(null);
        setPersonData({ firstName: '', lastName: '', age: '', dni: '', phone: '' });
        lastRecognitionTimeRef.current = 0;
        isRecognizingRef.current = false;
    };

    return (
        <main className="image-page">
            <div className="image-header">
                <div>
                    <p className="eyebrow">Visión por computador</p>
                    <h1>Clasificador de imagen</h1>
                    <p>Activa la cámara para verificar la identidad con DeepFace.</p>
                </div>
                <div className="image-actions">
                    {!isActive && <button className="image-button" type="button" onClick={start} disabled={isStarting}>{isStarting ? 'Cargando...' : 'Iniciar cámara'}</button>}
                    {isActive && <button className="image-button image-button-stop" type="button" onClick={stop}>Detener cámara</button>}
                </div>
            </div>
            {!SUPABASE_CONFIGURED && <p className="image-warning" role="status">Supabase no está configurado: la cámara funciona, pero el acceso no se puede verificar ni guardar todavía.</p>}
            {error && <p className="image-error" role="alert">{error}</p>}

            <section className={`access-result access-result-${accessStatus}`} aria-live="polite">
                <div className="access-result-icon">{accessStatus === 'allowed' ? '✓' : accessStatus === 'denied' ? '×' : accessStatus === 'error' ? '!' : '?'}</div>
                <div>
                    <strong>{accessStatus === 'allowed' ? 'Acceso concedido' : accessStatus === 'denied' ? 'Acceso denegado' : accessStatus === 'error' ? 'Error de reconocimiento' : accessStatus === 'checking' ? 'DeepFace verificando...' : 'Esperando una cara'}</strong>
                    <span>{accessStatus === 'allowed' ? `Registro reconocido: ${accessRecord?.firstName} ${accessRecord?.lastName}` : accessStatus === 'denied' ? 'La cara no coincide con ningún registro autorizado.' : accessStatus === 'error' ? 'Revisa que el backend DeepFace esté ejecutándose.' : 'La cámara se comparará con las imágenes registradas en Supabase.'}</span>
                </div>
            </section>

            {accessStatus === 'allowed' && accessRecord && <section className="recognized-person" aria-label="Información de la persona reconocida">
                <div className="recognized-person-image"><img src={accessRecord.image} alt={`Imagen de ${accessRecord.firstName} ${accessRecord.lastName}`} /></div>
                <div className="recognized-person-data">
                    <p className="eyebrow">Información registrada</p>
                    <h2>{accessRecord.firstName} {accessRecord.lastName}</h2>
                    <dl>
                        <div><dt>Edad</dt><dd>{accessRecord.age} años</dd></div>
                        <div><dt>DNI</dt><dd>{accessRecord.dni}</dd></div>
                        <div><dt>Número de teléfono</dt><dd>{accessRecord.phone}</dd></div>
                        <div><dt>Imagen guardada</dt><dd>Supabase Storage</dd></div>
                    </dl>
                </div>
            </section>}

            <section className="image-workspace" aria-label="Clasificador de imagen">
                <div className="image-camera">
                    <video ref={videoRef} className="deepface-video" muted playsInline />
                    <canvas ref={canvasRef} width={CAMERA_SIZE} height={CAMERA_SIZE} />
                    {!isActive && <div className="image-placeholder"><span>○</span><strong>Cámara inactiva</strong><small>Presiona iniciar para comenzar</small></div>}
                </div>

                <div className="image-results">
                    <div className="section-title-row"><h2>Reconocimiento DeepFace</h2><span className={`image-status ${isActive ? 'is-live' : ''}`}>{isActive ? 'En vivo' : 'En espera'}</span></div>
                    <p className="image-empty">Cada captura se compara contra las imágenes autorizadas guardadas en Supabase.</p>
                    <div className="face-predictions" aria-label="Predicción de autorización">
                        <div className="face-prediction-row">
                            <div><strong>Persona autorizada</strong><span>{Math.round(facePrediction.authorized)}%</span></div>
                            <div className="prediction-bar"><span className="prediction-authorized" style={{ width: `${facePrediction.authorized}%` }} /></div>
                        </div>
                        <div className="face-prediction-row">
                            <div><strong>Persona no autorizada</strong><span>{Math.round(facePrediction.unauthorized)}%</span></div>
                            <div className="prediction-bar"><span className="prediction-unauthorized" style={{ width: `${facePrediction.unauthorized}%` }} /></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="image-register" aria-label="Registro de fotografías">
                <div className="section-title-row">
                    <div><p className="eyebrow">Registro</p><h2>Fotografías capturadas</h2></div>
                    <span className="image-count">{records.length} registradas</span>
                </div>

                <div className="register-form">
                    <div className="capture-preview">
                        {pendingCapture ? <img src={pendingCapture.image} alt={`Captura: ${pendingCapture.label}`} /> : <span>La próxima imagen detectada aparecerá aquí</span>}
                    </div>
                    <div className="register-fields">
                        <label htmlFor="person-first-name-image">Nombre</label>
                        <input id="person-first-name-image" type="text" value={personData.firstName} onChange={(e) => setPersonData((current) => ({ ...current, firstName: e.target.value }))} placeholder="Nombre" />
                        <label htmlFor="person-last-name-image">Apellido</label>
                        <input id="person-last-name-image" type="text" value={personData.lastName} onChange={(e) => setPersonData((current) => ({ ...current, lastName: e.target.value }))} placeholder="Apellido" />
                        <label htmlFor="person-age-image">Edad</label>
                        <input id="person-age-image" type="number" min="0" max="150" value={personData.age} onChange={(e) => setPersonData((current) => ({ ...current, age: e.target.value }))} placeholder="Edad" />
                        <label htmlFor="person-dni-image">DNI</label>
                        <input id="person-dni-image" type="text" value={personData.dni} onChange={(e) => setPersonData((current) => ({ ...current, dni: e.target.value }))} placeholder="DNI" />
                        <label htmlFor="person-phone-image">Número de teléfono</label>
                        <input id="person-phone-image" type="tel" value={personData.phone} onChange={(e) => setPersonData((current) => ({ ...current, phone: e.target.value }))} placeholder="Número de teléfono" />
                        <p className="capture-label">Etiqueta detectada: <strong>{pendingCapture?.label ?? 'Pendiente'}</strong></p>
                        <button className="image-button" type="button" onClick={() => void registerCapture()} disabled={!pendingCapture || !personData.firstName.trim() || !personData.lastName.trim() || !personData.age || !personData.dni.trim() || !personData.phone.trim() || isSaving || pendingCapture.label.trim().toLowerCase() !== AUTHORIZED_LABEL}>{isSaving ? 'Guardando...' : 'Registrar imagen'}</button>
                        {pendingCapture && <button className="image-button image-button-delete" type="button" onClick={deleteCapture}>Eliminar imagen</button>}
                    </div>
                </div>

                {records.length > 0 && <div className="records-list">{records.map((rec) => (
                    <article className="record-item" key={rec.id}>
                        <img src={rec.image} alt={`Registro de ${rec.firstName} ${rec.lastName}`} />
                        <div><strong>{rec.firstName} {rec.lastName}</strong><span>{rec.dni} · {rec.phone}</span><small>{rec.age} años · {rec.date}</small></div>
                    </article>
                ))}</div>}
            </section>
        </main>
    );
}

export default ImageModel;
