import { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import './ImageModel.css';

const MODEL_URL = '/my_model_image/';
const CAMERA_SIZE = 400;
const CAPTURE_CONFIDENCE = 0.85;

type Prediction = { className: string; probability: number };

type ImageRecord = {
    id: number;
    name: string;
    label: string;
    image: string;
    date: string;
};

function ImageModel() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const modelRef = useRef<any | null>(null);
    const webcamRef = useRef<any | null>(null);
    const animationRef = useRef<number | null>(null);
    const isMountedRef = useRef(true);
    const lastCapturedLabelRef = useRef('');
    const lastCaptureTimeRef = useRef(0);

    const [isStarting, setIsStarting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [pendingCapture, setPendingCapture] = useState<{ image: string; label: string } | null>(null);
    const [records, setRecords] = useState<ImageRecord[]>([]);
    const [personName, setPersonName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
            webcamRef.current?.stop?.();
            if (modelRef.current?.dispose) modelRef.current.dispose();
        };
    }, []);

    const predict = async () => {
        const model = modelRef.current;
        const webcam = webcamRef.current;
        const canvas = canvasRef.current;
        if (!model || !webcam || !canvas || !isMountedRef.current) return;

        webcam.update?.();
        // tmImage models expose predict and/or classify; try predict then classify
        let nextPredictions: Prediction[] = [];
        try {
            nextPredictions = await model.predict(webcam.canvas) as Prediction[];
        } catch {
            try {
                nextPredictions = await model.classify(webcam.canvas) as Prediction[];
            } catch {
                // give up
                nextPredictions = [];
            }
        }

        if (!isMountedRef.current) return;

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(webcam.canvas, 0, 0, CAMERA_SIZE, CAMERA_SIZE);
        setPredictions(nextPredictions);

        const best = nextPredictions.reduce<Prediction | null>((bestSoFar, p) => (!bestSoFar || p.probability > bestSoFar.probability ? p : bestSoFar), null);
        const now = Date.now();
        if (best && best.probability >= CAPTURE_CONFIDENCE
            && best.className !== lastCapturedLabelRef.current
            && now - lastCaptureTimeRef.current > 1000) {
            lastCapturedLabelRef.current = best.className;
            lastCaptureTimeRef.current = now;
            setPendingCapture({ image: canvas.toDataURL('image/jpeg', 0.9), label: best.className });
        }

        animationRef.current = requestAnimationFrame(() => void predict());
    };

    const start = async () => {
        if (isStarting || isActive) return;
        setIsStarting(true);
        setError('');
        try {
            const model = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`);
            const webcam = new (tmImage as any).Webcam(CAMERA_SIZE, CAMERA_SIZE, true);
            await webcam.setup();
            await webcam.play();
            if (!isMountedRef.current) {
                webcam.stop();
                model.dispose?.();
                return;
            }
            modelRef.current = model;
            webcamRef.current = webcam;
            setIsActive(true);
            setIsStarting(false);
            void predict();
        } catch (err) {
            setIsStarting(false);
            setError('No se pudo iniciar la cámara o cargar el modelo. Revisa permisos y que exista el modelo en public/my_model_image/');
        }
    };

    const stop = () => {
        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        webcamRef.current?.stop?.();
        modelRef.current?.dispose?.();
        webcamRef.current = null;
        modelRef.current = null;
        lastCapturedLabelRef.current = '';
        setIsActive(false);
        setPredictions([]);
    };

    const registerCapture = () => {
        if (!pendingCapture || !personName.trim()) return;
        setRecords((current) => [...current, {
            id: Date.now(),
            name: personName.trim(),
            label: pendingCapture.label,
            image: pendingCapture.image,
            date: new Date().toLocaleString('es-ES'),
        }]);
        setPendingCapture(null);
        setPersonName('');
    };

    const deleteCapture = () => {
        setPendingCapture(null);
        setPersonName('');
        lastCapturedLabelRef.current = '';
        lastCaptureTimeRef.current = Date.now();
    };

    return (
        <main className="image-page">
            <div className="image-header">
                <div>
                    <p className="eyebrow">Visión por computador</p>
                    <h1>Clasificador de imagen</h1>
                    <p>Activa la cámara para clasificar imágenes con tu modelo de Teachable Machine.</p>
                </div>
                <div className="image-actions">
                    {!isActive && <button className="image-button" type="button" onClick={start} disabled={isStarting}>{isStarting ? 'Cargando...' : 'Iniciar cámara'}</button>}
                    {isActive && <button className="image-button image-button-stop" type="button" onClick={stop}>Detener cámara</button>}
                </div>
            </div>
            {error && <p className="image-error" role="alert">{error}</p>}

            <section className="image-workspace" aria-label="Clasificador de imagen">
                <div className="image-camera">
                    <canvas ref={canvasRef} width={CAMERA_SIZE} height={CAMERA_SIZE} />
                    {!isActive && <div className="image-placeholder"><span>○</span><strong>Cámara inactiva</strong><small>Presiona iniciar para comenzar</small></div>}
                </div>

                <div className="image-results">
                    <div className="section-title-row"><h2>Predicciones</h2><span className={`image-status ${isActive ? 'is-live' : ''}`}>{isActive ? 'En vivo' : 'En espera'}</span></div>
                    {predictions.length > 0 ? predictions.map((p) => (
                        <div className="prediction-row" key={p.className}>
                            <div><strong>{p.className}</strong><span>{Math.round(p.probability * 100)}%</span></div>
                            <div className="prediction-bar"><span style={{ width: `${p.probability * 100}%` }} /></div>
                        </div>
                    )) : <p className="image-empty">Las clases detectadas aparecerán aquí.</p>}
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
                        <label htmlFor="person-name-image">Nombre</label>
                        <input id="person-name-image" type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Escribe un nombre" />
                        <p className="capture-label">Etiqueta detectada: <strong>{pendingCapture?.label ?? 'Pendiente'}</strong></p>
                        <button className="image-button" type="button" onClick={registerCapture} disabled={!pendingCapture || !personName.trim()}>Registrar imagen</button>
                        {pendingCapture && <button className="image-button image-button-delete" type="button" onClick={deleteCapture}>Eliminar imagen</button>}
                    </div>
                </div>

                {records.length > 0 && <div className="records-list">{records.map((rec) => (
                    <article className="record-item" key={rec.id}>
                        <img src={rec.image} alt={`Registro de ${rec.name}`} />
                        <div><strong>{rec.name}</strong><span>{rec.label}</span><small>{rec.date}</small></div>
                    </article>
                ))}</div>}
            </section>
        </main>
    );
}

export default ImageModel;
