import { useEffect, useRef, useState } from 'react';
import * as tmPose from '@teachablemachine/pose';
import type { CustomPoseNet } from '@teachablemachine/pose';
import './Movement.css';

const MODEL_URL = '/my_model/';
const CAMERA_SIZE = 400;
const CAPTURE_CONFIDENCE = 0.85;

type Prediction = Awaited<ReturnType<CustomPoseNet['predict']>>[number];
type MovementRecord = {
    id: number;
    name: string;
    movement: string;
    image: string;
    date: string;
};

function Movement() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const modelRef = useRef<CustomPoseNet | null>(null);
    const webcamRef = useRef<tmPose.Webcam | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isMountedRef = useRef(true);
    const lastCapturedLabelRef = useRef('');
    const lastCaptureTimeRef = useRef(0);
    const [isStarting, setIsStarting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [predictions, setPredictions] = useState<Awaited<ReturnType<CustomPoseNet['predict']>>>([]);
    const [pendingCapture, setPendingCapture] = useState<{ image: string; movement: string } | null>(null);
    const [records, setRecords] = useState<MovementRecord[]>([]);
    const [personName, setPersonName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
            webcamRef.current?.stop();
            modelRef.current?.dispose();
        };
    }, []);

    const predict = async () => {
        const model = modelRef.current;
        const webcam = webcamRef.current;
        const canvas = canvasRef.current;
        if (!model || !webcam || !canvas || !isMountedRef.current) return;

        webcam.update();
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        const nextPredictions = await model.predict(posenetOutput);
        if (!isMountedRef.current) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(webcam.canvas, 0, 0);
        tmPose.drawKeypoints(pose.keypoints, 0.5, context);
        tmPose.drawSkeleton(pose.keypoints, 0.5, context);
        setPredictions(nextPredictions);

        const bestPrediction = nextPredictions.reduce<Prediction | null>((best, prediction) => (
            !best || prediction.probability > best.probability ? prediction : best
        ), null);
        const now = Date.now();
        if (bestPrediction && bestPrediction.probability >= CAPTURE_CONFIDENCE
            && bestPrediction.className !== lastCapturedLabelRef.current
            && now - lastCaptureTimeRef.current > 1000) {
            lastCapturedLabelRef.current = bestPrediction.className;
            lastCaptureTimeRef.current = now;
            setPendingCapture({ image: canvas.toDataURL('image/jpeg', 0.9), movement: bestPrediction.className });
        }
        animationFrameRef.current = requestAnimationFrame(() => void predict());
    };

    const start = async () => {
        if (isStarting || isActive) return;
        setIsStarting(true);
        setError('');
        try {
            const model = await tmPose.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`);
            const webcam = new tmPose.Webcam(CAMERA_SIZE, CAMERA_SIZE, true);
            await webcam.setup();
            await webcam.play();
            if (!isMountedRef.current) {
                webcam.stop();
                model.dispose();
                return;
            }
            modelRef.current = model;
            webcamRef.current = webcam;
            setIsActive(true);
            setIsStarting(false);
            void predict();
        } catch {
            setIsStarting(false);
            setError('No se pudo iniciar la cámara. Revisa el permiso del navegador y que exista el modelo en public/my_model.');
        }
    };

    const stop = () => {
        if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
        webcamRef.current?.stop();
        modelRef.current?.dispose();
        webcamRef.current = null;
        modelRef.current = null;
        lastCapturedLabelRef.current = '';
        setIsActive(false);
        setPredictions([]);
    };

    const registerCapture = () => {
        if (!pendingCapture || !personName.trim()) return;
        setRecords((currentRecords) => [...currentRecords, {
            id: Date.now(),
            name: personName.trim(),
            movement: pendingCapture.movement,
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
        <main className="movement-page">
            <div className="movement-header">
                <div>
                    <p className="eyebrow">Visión por computador</p>
                    <h1>Reconocimiento de movimiento</h1>
                    <p className="movement-intro">Activa tu cámara para identificar la postura con tu modelo de Teachable Machine.</p>
                </div>
                <div className="movement-actions">
                    {!isActive && <button className="movement-button" type="button" onClick={start} disabled={isStarting}>{isStarting ? 'Cargando...' : 'Iniciar cámara'}</button>}
                    {isActive && <button className="movement-button movement-button-stop" type="button" onClick={stop}>Detener cámara</button>}
                </div>
            </div>
            {error && <p className="movement-error" role="alert">{error}</p>}
            <section className="movement-workspace" aria-label="Detector de movimiento">
                <div className="movement-camera">
                    <canvas ref={canvasRef} width={CAMERA_SIZE} height={CAMERA_SIZE} />
                    {!isActive && <div className="movement-placeholder"><span>○</span><strong>Cámara inactiva</strong><small>Presiona iniciar para comenzar</small></div>}
                </div>
                <div className="movement-results">
                    <div className="section-title-row"><h2>Predicciones</h2><span className={`movement-status ${isActive ? 'is-live' : ''}`}>{isActive ? 'En vivo' : 'En espera'}</span></div>
                    {predictions.length > 0 ? predictions.map((prediction) => (
                        <div className="prediction-row" key={prediction.className}>
                            <div><strong>{prediction.className}</strong><span>{Math.round(prediction.probability * 100)}%</span></div>
                            <div className="prediction-bar"><span style={{ width: `${prediction.probability * 100}%` }} /></div>
                        </div>
                    )) : <p className="movement-empty">Las clases detectadas aparecerán aquí.</p>}
                </div>
            </section>
            <section className="movement-register" aria-label="Registro de fotografías">
                <div className="section-title-row">
                    <div><p className="eyebrow">Registro</p><h2>Fotografías capturadas</h2></div>
                    <span className="movement-count">{records.length} registradas</span>
                </div>
                <div className="register-form">
                    <div className="capture-preview">
                        {pendingCapture ? <img src={pendingCapture.image} alt={`Captura: ${pendingCapture.movement}`} /> : <span>La próxima postura detectada aparecerá aquí</span>}
                    </div>
                    <div className="register-fields">
                        <label htmlFor="person-name">Nombre</label>
                        <input id="person-name" type="text" value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="Escribe un nombre" />
                        <p className="capture-label">Movimiento detectado: <strong>{pendingCapture?.movement ?? 'Pendiente'}</strong></p>
                        <button className="movement-button" type="button" onClick={registerCapture} disabled={!pendingCapture || !personName.trim()}>Registrar fotografía</button>
                        {pendingCapture && <button className="movement-button movement-button-delete" type="button" onClick={deleteCapture}>Eliminar fotografía</button>}
                    </div>
                </div>
                {records.length > 0 && <div className="records-list">{records.map((record) => (
                    <article className="record-item" key={record.id}>
                        <img src={record.image} alt={`Registro de ${record.name}`} />
                        <div><strong>{record.name}</strong><span>{record.movement}</span><small>{record.date}</small></div>
                    </article>
                ))}</div>}
            </section>
        </main>
    );
}

export default Movement;