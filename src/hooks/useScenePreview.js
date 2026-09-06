import { useCallback, useEffect, useState } from 'react';
import { SCENE_PRESETS, SCENE_DEMO_INTERVAL_MS } from '../utils/scenePresets';

// Admin previews are deliberately transient: forecast data and preferences stay untouched.
export function useScenePreview(isOpen) {
    const [scenePreview, setScenePreview] = useState(null);
    const [scenePlaying, updateScenePlaying] = useState(false);
    const [sceneShowcase, setSceneShowcase] = useState(false);

    const setScenePlaying = useCallback(playing => {
        if (playing) setScenePreview(current => current || SCENE_PRESETS[0].scene);
        updateScenePlaying(playing);
    }, []);

    const resetScenePreview = useCallback(() => {
        setScenePreview(null);
        updateScenePlaying(false);
        setSceneShowcase(false);
    }, []);

    useEffect(() => {
        if (!isOpen || !scenePlaying) return;
        let timer;
        const advance = () => setScenePreview(current => {
            const index = SCENE_PRESETS.findIndex(({ scene }) =>
                scene.season === current?.season && scene.weather === current?.weather && scene.phase === current?.phase);
            return SCENE_PRESETS[(index + 1) % SCENE_PRESETS.length].scene;
        });
        const updateTimer = () => {
            clearInterval(timer);
            if (document.visibilityState !== 'hidden') timer = setInterval(advance, SCENE_DEMO_INTERVAL_MS);
        };
        updateTimer();
        document.addEventListener('visibilitychange', updateTimer);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', updateTimer);
        };
    }, [isOpen, scenePlaying]);

    return { scenePreview, scenePlaying, sceneShowcase, setScenePreview, setScenePlaying, setSceneShowcase, resetScenePreview };
}
