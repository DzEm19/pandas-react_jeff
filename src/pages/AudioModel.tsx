import { useEffect, useRef, useState } from 'react';
import * as speechCommands from '@tensorflow-models/speech-commands';
import '@tensorflow/tfjs';
import './Dashboard.css';
import { deleteAudio, loadSavedAudios, saveAudio, type SavedAudio } from '../services/audioStorage';

type AudioRecognizer = speechCommands.SpeechCommandRecognizer;

const MODEL_PATH = '/my_model/';

function AudioModel() {
    const recognizerRef = useRef<AudioRecognizer | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const recordingStartedAtRef = useRef(0);
    const [labels, setLabels] = useState<string[]>([]);
    const [scores, setScores] = useState<number[]>([]);
    const [savedAudios, setSavedAudios] = useState<SavedAudio[]>([]);
    const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
    const audioUrlsRef = useRef<Record<string, string>>({});
    const [isListening, setIsListening] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        audioUrlsRef.current = audioUrls;
    }, [audioUrls]);

    useEffect(() => {
        let isMounted = true;
        loadSavedAudios()
            .then((audios) => {
                if (!isMounted) return;
                setSavedAudios(audios);
                setAudioUrls(Object.fromEntries(audios.map((audio) => [audio.id, URL.createObjectURL(audio.blob)])));
            })
            .catch(() => {
                if (isMounted) setError('No se pudieron cargar los audios guardados.');
            });

        return () => {
            isMounted = false;
            recognizerRef.current?.stopListening();
            recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
            Object.values(audioUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    const stopListening = () => {
        recognizerRef.current?.stopListening();
        setIsListening(false);
    };

    const stopRecording = () => {
        recorderRef.current?.stop();
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
    };

    const startRecording = async () => {
        setError('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';
            const recorder = new MediaRecorder(stream, { mimeType });
            recordingStreamRef.current = stream;
            recorderRef.current = recorder;
            recordingChunksRef.current = [];
            recordingStartedAtRef.current = Date.now();
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordingChunksRef.current.push(event.data);
            };
            recorder.onstop = async () => {
                const blob = new Blob(recordingChunksRef.current, { type: mimeType });
                if (blob.size === 0) return;
                const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                const audio: SavedAudio = {
                    id,
                    name: `Grabación ${new Date().toLocaleString('es-ES')}`,
                    createdAt: new Date().toISOString(),
                    duration: Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000)),
                    blob,
                };
                try {
                    await saveAudio(audio);
                    setSavedAudios((current) => [audio, ...current]);
                    setAudioUrls((current) => ({ ...current, [id]: URL.createObjectURL(blob) }));
                } catch {
                    setError('La grabación terminó, pero no se pudo guardar.');
                }
            };
            recorder.start();
            setIsRecording(true);
        } catch (caughtError) {
            setError(caughtError instanceof Error
                ? caughtError.message
                : 'No se pudo acceder al micrófono para grabar.');
        }
    };

    const removeAudio = async (audio: SavedAudio) => {
        try {
            await deleteAudio(audio.id);
            if (audioUrls[audio.id]) URL.revokeObjectURL(audioUrls[audio.id]);
            setSavedAudios((current) => current.filter((item) => item.id !== audio.id));
            setAudioUrls((current) => {
                const next = { ...current };
                delete next[audio.id];
                return next;
            });
        } catch {
            setError('No se pudo eliminar el audio guardado.');
        }
    };

    const startListening = async () => {
        setError('');
        setIsLoading(true);

        try {
            const modelUrl = new URL(MODEL_PATH, window.location.origin).toString();
            const recognizer = recognizerRef.current ?? speechCommands.create(
                'BROWSER_FFT',
                undefined,
                `${modelUrl}model.json`,
                `${modelUrl}metadata.json`,
            );

            await recognizer.ensureModelLoaded();
            const classLabels = recognizer.wordLabels();
            recognizerRef.current = recognizer;
            setLabels(classLabels);
            setScores(classLabels.map(() => 0));

            recognizer.listen(async (result) => {
                const resultScores = Array.isArray(result.scores) ? result.scores[0] : result.scores;
                setScores(Array.from(resultScores));
            }, {
                includeSpectrogram: true,
                probabilityThreshold: 0.75,
                invokeCallbackOnNoiseAndUnknown: true,
                overlapFactor: 0.5,
            });
            setIsListening(true);
        } catch (caughtError) {
            setError(caughtError instanceof Error
                ? caughtError.message
                : 'No se pudo cargar el modelo de audio.');
            setIsListening(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <p className="eyebrow">Herramienta de administración</p>
                    <h1>Modelo de audio</h1>
                </div>
                <span className={`audio-status ${isListening ? 'active' : ''}`}>
                    {isListening ? 'Micrófono activo' : 'En espera'}
                </span>
            </div>

            <section className="audio-model-panel">
                <div className="audio-model-intro">
                    <span className="audio-model-icon" aria-hidden="true">◉</span>
                    <div>
                        <h2>Teachable Machine Audio Model</h2>
                        <p>Inicia el micrófono para clasificar sonidos con el modelo entrenado.</p>
                    </div>
                </div>

                <div className="action-row">
                    <button
                        className="upload-button audio-action-button"
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Cargando modelo...' : isListening ? 'Detener escucha' : 'Iniciar escucha'}
                    </button>
                    {isListening && <span className="audio-live-note">Escuchando desde este navegador</span>}
                </div>

                <div className="audio-recording-controls">
                    <button
                        className="secondary-button audio-action-button"
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                    >
                        {isRecording ? 'Guardar y detener grabación' : 'Grabar audio'}
                    </button>
                    {isRecording && <span className="audio-live-note">Grabando desde este navegador</span>}
                </div>

                {error && (
                    <div className="audio-error" role="alert">
                        <strong>No se pudo iniciar el modelo.</strong>
                        <p>{error}</p>
                        <small>Verifica que existan /my_model/model.json y /my_model/metadata.json.</small>
                    </div>
                )}

                <div className="audio-results" aria-live="polite">
                    {labels.length === 0 ? (
                        <div className="audio-empty-result">
                            <strong>Sin predicciones todavía</strong>
                            <span>Las clases del modelo aparecerán aquí al iniciar la escucha.</span>
                        </div>
                    ) : labels.map((label, index) => {
                        const score = scores[index] ?? 0;
                        return (
                            <div className="audio-result" key={label}>
                                <div className="audio-result-heading">
                                    <strong>{label}</strong>
                                    <span>{(score * 100).toFixed(1)}%</span>
                                </div>
                                <div className="audio-progress" aria-hidden="true">
                                    <span style={{ width: `${score * 100}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <section className="saved-audios-section">
                    <div className="section-title-row">
                        <h2>Audios guardados</h2>
                        <span className="report-tag">{savedAudios.length}</span>
                    </div>
                    {savedAudios.length === 0 ? (
                        <div className="audio-empty-result">
                            <strong>Aún no hay grabaciones</strong>
                            <span>Usa “Grabar audio” para guardar una muestra reproducible.</span>
                        </div>
                    ) : savedAudios.map((audio) => (
                        <div className="saved-audio-item" key={audio.id}>
                            <div className="saved-audio-heading">
                                <div>
                                    <strong>{audio.name}</strong>
                                    <span>{audio.duration}s · {new Date(audio.createdAt).toLocaleString('es-ES')}</span>
                                </div>
                                <button className="audio-delete-button" type="button" onClick={() => removeAudio(audio)}>
                                    Eliminar
                                </button>
                            </div>
                            <audio controls src={audioUrls[audio.id]} preload="metadata" />
                        </div>
                    ))}
                </section>
            </section>
        </div>
    );
}

export default AudioModel;
