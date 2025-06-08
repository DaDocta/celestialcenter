// src/App.js
import React, { useRef } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import Home from './pages/Home';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Checkout from './pages/Checkout';
import Checkedout from './pages/Checkedout';
import Debug from './pages/Debug';
import BackgroundVideo from './components/BackgroundVideo';
import { AuthProvider, AuthContext } from './AuthContext'; // Import AuthContext and AuthProvider
import './styles/App.css';
import './styles/Transitions.css';

const App = () => {
  const location = useLocation();
  const nodeRef = useRef(null); // Create a ref for the transitioning element

  return (
    <AuthProvider>
      <div className="app-container">
        <BackgroundVideo />
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={location.pathname}
            classNames="fade"
            timeout={{ enter: 1500, exit: 500 }}
            unmountOnExit
            appear
            nodeRef={nodeRef} // Use nodeRef to avoid findDOMNode
          >
            <div className="page-content" ref={nodeRef}>
              <AuthContext.Consumer>
                {({ isAuthenticated }) => (
                  <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Product />} />
                    <Route path="/product/:id" element={<Product />} />
                    <Route path="/cart" element={isAuthenticated ? <Cart /> : <Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/checkedout" element={<Checkedout />} />
                    <Route path="/debug" element={<Debug />} />
                  </Routes>
                )}
              </AuthContext.Consumer>
            </div>
          </CSSTransition>
        </SwitchTransition>
      </div>
    </AuthProvider>
  );
};

export default App;
