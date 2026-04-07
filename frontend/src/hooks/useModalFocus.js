import { useEffect, useRef } from 'react';

const isFocusable = (element) => {
  if (!element) return false;
  
  if (element.hasAttribute('disabled')) return false;
  if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') return false;
  if (element.hasAttribute('hidden')) return false;
  
  const tabIndex = element.getAttribute('tabindex');
  if (tabIndex !== null && tabIndex === '-1') return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  
  if (element.offsetParent === null) return false;
  
  try {
    const rects = element.getClientRects();
    if (rects.length === 0) return false;
  } catch (e) {
    return false;
  }
  
  return true;
};

const getFocusableElements = (container) => {
  if (!container) return [];
  
  const selectors = 'button, [href], input, select, textarea, [tabindex]';
  const elements = container.querySelectorAll(selectors);
  
  return Array.from(elements).filter(isFocusable);
};

const useModalFocus = (modalRef, isOpen, onClose) => {
  const previousFocusRef = useRef(null);
  const focusTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    
    focusTimeoutRef.current = setTimeout(() => {
      const focusableElements = getFocusableElements(modalRef.current);
      const firstFocusable = focusableElements.length > 0 ? focusableElements[0] : null;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 0);

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      document.body.style.overflow = previousOverflow || '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, modalRef]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements(modalRef.current);
        
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, modalRef, onClose]);
};

export default useModalFocus;
