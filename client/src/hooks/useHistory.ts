import { useState, useCallback } from 'react';

function useHistory<T>(initialValue: T) {
    const [past, setPast] = useState<T[]>([]);
    const [present, setPresent] = useState<T>(initialValue);
    const [future, setFuture] = useState<T[]>([]);

    const set = useCallback((newPresent: T) => {
        setPast(prev => [...prev, present]);
        setPresent(newPresent);
        setFuture([]);
    }, [present]);

    const undo = useCallback(() => {
        if (past.length === 0) return;
        const previous = past[past.length -1];
        setPast(prev => prev.slice(0, -1));
        setFuture(prev => [present, ...prev]);
        setPresent(previous);
    }, [past, present]);

    const redo = useCallback(() => {
        if (future.length === 0) return;
        const next = future[0];
        setFuture(prev => prev.slice(1));
        setPast(prev => [...prev, present]);
        setPresent(next);
    }, [future, present]);

    return { present, set, undo, redo };
}

export default useHistory;