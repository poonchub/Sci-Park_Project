import { useEffect, useRef, useCallback } from 'react';

interface UseInteractionTrackerOptions {
    pagePath: string;
    onInteractionChange?: (count: number) => void;
}

export const useInteractionTracker = ({ pagePath, onInteractionChange }: UseInteractionTrackerOptions) => {
    const interactionCount = useRef(0);
    const lastScrollTime = useRef(0);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

    // เพิ่ม interaction count
    const incrementInteraction = useCallback(() => {
        interactionCount.current += 1;
        console.log(`[INTERACTION DEBUG] ${pagePath} - Interaction count: ${interactionCount.current}`);
        onInteractionChange?.(interactionCount.current);
    }, [pagePath, onInteractionChange]);

    // Handle click events
    const handleClick = useCallback((event: MouseEvent) => {
        // ไม่นับ clicks บน elements ที่ไม่สำคัญ เช่น scrollbars, navigation
        const target = event.target as HTMLElement;
        if (target && (
            target.tagName === 'BUTTON' ||
            target.tagName === 'A' ||
            target.tagName === 'INPUT' ||
            target.tagName === 'SELECT' ||
            target.closest('[role="button"]') ||
            target.closest('[data-interactive]')
        )) {
            incrementInteraction();
        }
    }, [incrementInteraction]);

    // Handle scroll events (debounced)
    const handleScroll = useCallback(() => {
        const now = Date.now();
        if (now - lastScrollTime.current > 1000) { // Debounce 1 second
            incrementInteraction();
            lastScrollTime.current = now;
        }

        // Clear existing timeout
        if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current);
        }

        // Set new timeout for scroll end
        scrollTimeout.current = setTimeout(() => {
            incrementInteraction();
        }, 2000); // Count as interaction after 2 seconds of no scrolling
    }, [incrementInteraction]);

    // Handle keypress events (important interactions)
    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        // นับเฉพาะ key presses ที่สำคัญ
        if (event.key === 'Enter' || event.key === 'Tab' || event.key === 'Escape') {
            incrementInteraction();
        }
    }, [incrementInteraction]);

    useEffect(() => {
        // Add event listeners
        document.addEventListener('click', handleClick);
        document.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('keydown', handleKeyPress);

        console.log(`[INTERACTION DEBUG] ${pagePath} - Interaction tracker initialized`);

        // Cleanup
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('scroll', handleScroll);
            document.removeEventListener('keydown', handleKeyPress);
            
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }

            console.log(`[INTERACTION DEBUG] ${pagePath} - Interaction tracker cleaned up. Final count: ${interactionCount.current}`);
        };
    }, [pagePath, handleClick, handleScroll, handleKeyPress]);

    // Reset interaction count
    const resetInteractionCount = useCallback(() => {
        interactionCount.current = 0;
        console.log(`[INTERACTION DEBUG] ${pagePath} - Interaction count reset to 0`);
        onInteractionChange?.(0);
    }, [pagePath, onInteractionChange]);

    // Get current interaction count
    const getInteractionCount = useCallback(() => {
        return interactionCount.current;
    }, []);

    return {
        getInteractionCount,
        resetInteractionCount,
        incrementInteraction
    };
}; 