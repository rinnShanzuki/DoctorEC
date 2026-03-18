import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState("login"); // "login" or "register"

    const openAuth = (mode = "login") => {
        setAuthMode(mode);
        setIsAuthOpen(true);
    };

    const openSignIn = () => openAuth("login");
    const openSignUp = () => openAuth("register");

    const closeAuth = () => {
        setIsAuthOpen(false);
    };

    return (
        <ModalContext.Provider value={{ isAuthOpen, authMode, openAuth, openSignIn, openSignUp, closeAuth }}>
            {children}
        </ModalContext.Provider>
    );
};
