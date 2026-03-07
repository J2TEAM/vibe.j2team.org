/* oxlint-disable */
 
 
import { LibMedia } from "../libmedia/libmedia.js";
import { LibMidi, createUnlockingAudioContext } from "../libmidi/libmidi.js";
import { codeMap, KeyRepeatManager, T9InputManager, KeyMappingManager } from "./key.js";
import { EventQueue } from "./eventqueue.js";
import { initKbdListeners, setKbdHandler, kbdWidth, kbdHeight } from "./screenKbd.js";

// we need to import natives here, don't use System.loadLibrary
// since CheerpJ fails to load them in firefox and we can't set breakpoints
import canvasFontNatives from "../libjs/libcanvasfont.js";
import canvasGraphicsNatives from "../libjs/libcanvasgraphics.js";
import gles2Natives from "../libjs/libgles2.js";
import jsReferenceNatives from "../libjs/libjsreference.js";
import mediaBridgeNatives from "../libjs/libmediabridge.js";
import midiBridgeNatives from "../libjs/libmidibridge.js";

const evtQueue = new EventQueue();
const sp = new URLSearchParams(location.search);

const cheerpjWebRoot = '/app' + location.pathname.replace(/\/[^/]*$/, '');

let isMobile = sp.get('mobile');

let display = null;
let screenCtx = null;

// Default fractionScale to true on mobile for better zoom experience
let fractionScale = sp.get('fractionScale') !== null 
    ? sp.get('fractionScale') === 'true'
    : (localStorage && localStorage.getItem("pl.zb3.freej2me.fractionScale") !== null)
        ? localStorage.getItem("pl.zb3.freej2me.fractionScale") === "true"
        : !!isMobile; // Default to true on mobile, false on desktop
let scaleSet = false;

const keyRepeatManager = new KeyRepeatManager();
const t9InputManager = new T9InputManager();
const keyMappingManager = new KeyMappingManager();

window.evtQueue = evtQueue;
window.t9InputManager = t9InputManager;
window.keyMappingManager = keyMappingManager;
window.KeyMappingManager = KeyMappingManager;

function autoscale() {
    if (!scaleSet) return;

    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;

    if (isMobile) {
        document.getElementById('left-keys').style.display = '';
        document.getElementById('right-keys').style.display = '';

        if (screenWidth > screenHeight) {
            document.body.classList.add('kbd-landscape');
            document.body.classList.remove('kbd-portrait');
            // Get actual keypad widths including safe-area padding
            const leftKeys = document.getElementById('left-keys');
            const rightKeys = document.getElementById('right-keys');
            const leftKeyWidth = leftKeys ? leftKeys.offsetWidth : kbdWidth;
            const rightKeyWidth = rightKeys ? rightKeys.offsetWidth : kbdWidth;
            screenWidth = screenWidth - leftKeyWidth - rightKeyWidth;
        } else {
            document.body.classList.add('kbd-portrait');
            document.body.classList.remove('kbd-landscape');
            screenHeight = screenHeight - kbdHeight;
        }
    }

    let scale = Math.min(
        screenWidth / screenCtx.canvas.width,
        screenHeight / screenCtx.canvas.height
    );

    if (!fractionScale) {
        scale = scale | 0;
    }

    display.style.zoom = scale;
}

function setListeners() {
    let mouseDown = false;
    let noMouse = false;

    // Register T9 input listener - when a character is confirmed, send it as key event
    t9InputManager.register((char, isPreview) => {
        if (!isPreview) {
            // Character is confirmed, send the actual character key event
            const charCode = char.toUpperCase().charCodeAt(0);
            // Map character to corresponding Key code if it's a letter
            let keyCode;
            if (char >= 'a' && char <= 'z') {
                keyCode = `Key${char.toUpperCase()}`;
            } else if (char >= '0' && char <= '9') {
                keyCode = `Digit${char}`;
            } else if (char === ' ') {
                keyCode = 'Space';
            } else {
                // For other characters, just use the char code
                keyCode = null;
            }

            if (keyCode && codeMap[keyCode]) {
                // Send keydown then keyup for the character
                evtQueue.queueEvent({
                    kind: 'keydown',
                    args: [codeMap[keyCode], charCode, false, false]
                });
                evtQueue.queueEvent({
                    kind: 'keyup',
                    args: [codeMap[keyCode], charCode, false, false]
                });
            }
        }
        // Preview mode - could show the current character in UI if needed
    });

    setKbdHandler((isDown, key) => {
        // Check if this is a digit key and we're in text/ABC mode
        if (key.startsWith('Digit') && t9InputManager.getInputMode() === 'text') {
            if (isDown) {
                const digit = key.substring(5); // Get '0'-'9' from 'Digit0'-'Digit9'
                t9InputManager.handleDigitPress(digit);
            }
            // In text mode, don't send the digit directly - T9InputManager will handle it
            return;
        } else {
            const symbol = key.startsWith('Digit') ? key.substring(5) : '\x00';
            keyRepeatManager.post(isDown, key, { symbol, ctrlKey: false, shiftKey: false });
        }
    });

    function handleKeyEvent(e) {
        const isDown = e.type === 'keydown';

        // Check if KeyMappingManager is recording
        if (keyMappingManager.isRecording && isDown) {
            keyMappingManager.handleRecordingKey(e.code);
            e.preventDefault();
            return;
        }

        // Get the mapped key code from KeyMappingManager
        const mappedKeyCode = keyMappingManager.getKeyCode(e.code);
        
        // If we have a mapped key code, use it; otherwise fall back to codeMap
        if (mappedKeyCode !== null) {
            keyRepeatManager.post(isDown, e.code, {
                symbol: e.key.length == 1 ? e.key.charCodeAt(0) : '\x00',
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                mappedKeyCode: mappedKeyCode
            });
            e.preventDefault();
        } else if (codeMap[e.code]) {
            keyRepeatManager.post(isDown, e.code, {
                symbol: e.key.length == 1 ? e.key.charCodeAt(0) : '\x00',
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey
            });
            e.preventDefault();
        }
    }

    display.addEventListener('keydown', handleKeyEvent);
    display.addEventListener('keyup', handleKeyEvent);

    keyRepeatManager.register((kind, key, args) => {
        if (kind === 'click') {
            if (key === 'Maximize') {
                fractionScale = !fractionScale;
                localStorage && localStorage.setItem("pl.zb3.freej2me.fractionScale", fractionScale);
                autoscale();
            }
        } else {
            // Use mapped key code if available, otherwise use codeMap
            const keyCode = args.mappedKeyCode !== undefined ? args.mappedKeyCode : codeMap[key];
            if (keyCode) {
                console.log('queuing event with keyCode:', keyCode);
                evtQueue.queueEvent({
                    kind: kind === 'up' ? 'keyup' : 'keydown',
                    args: [keyCode, args.symbol, args.ctrlKey, args.shiftKey]
                });
            }
        }
    });

    display.addEventListener('mousedown', async e => {
        display.focus();
        if (noMouse) return;

        evtQueue.queueEvent({
            kind: 'pointerpressed',
            x: e.offsetX / display.currentCSSZoom | 0,
            y: e.offsetY / display.currentCSSZoom | 0,
        });

        mouseDown = true;

        e.preventDefault();
    });

    display.addEventListener('mousemove', async e => {
        if (noMouse) return;
        if (!mouseDown) return;

        evtQueue.queueEvent({
            kind: 'pointerdragged',
            x: e.offsetX / display.currentCSSZoom | 0,
            y: e.offsetY / display.currentCSSZoom | 0,
        });

        e.preventDefault();
    });

    document.addEventListener('mouseup', async e => {
        if (noMouse) return;
        if (!mouseDown) return;

        mouseDown = false;

        evtQueue.queueEvent({
            kind: 'pointerreleased',
            x: (e.pageX - display.offsetLeft) / display.currentCSSZoom | 0,
            y: (e.pageY - display.offsetTop) / display.currentCSSZoom | 0,
        });

        e.preventDefault();
    });


    display.addEventListener('touchstart', async e => {
        display.focus();
        noMouse = true;

        evtQueue.queueEvent({
            kind: 'pointerpressed',
            x: (e.changedTouches[0].pageX - display.offsetLeft) / display.currentCSSZoom | 0,
            y: (e.changedTouches[0].pageY - display.offsetTop) / display.currentCSSZoom | 0,
        });

        e.preventDefault();
    }, { passive: false });

    display.addEventListener('touchmove', async e => {
        noMouse = true;

        evtQueue.queueEvent({
            kind: 'pointerdragged',
            x: (e.changedTouches[0].pageX - display.offsetLeft) / display.currentCSSZoom | 0,
            y: (e.changedTouches[0].pageY - display.offsetTop) / display.currentCSSZoom | 0,
        });

        e.preventDefault();
    }, { passive: false });

    display.addEventListener('touchend', async e => {
        noMouse = true;

        evtQueue.queueEvent({
            kind: 'pointerreleased',
            x: (e.changedTouches[0].pageX - display.offsetLeft) / display.currentCSSZoom | 0,
            y: (e.changedTouches[0].pageY - display.offsetTop) / display.currentCSSZoom | 0,
        });

        e.preventDefault();
    });

    document.addEventListener('mousedown', e => {
        console.log('refocus');
        setTimeout(() => display.focus(), 20);
        ;
    });

    display.addEventListener('blur', e => {
        console.log('refocus');
        // it doesn't work without any timeout
        setTimeout(() => display.focus(), 10);
        ;
    });

    window.addEventListener('resize', autoscale);

    initKbdListeners();
}

function setFaviconFromBuffer(arrayBuffer) {
    const blob = new Blob([arrayBuffer], { type: 'image/png' });

    const reader = new FileReader();
    reader.onload = function () {
        const dataURL = reader.result;

        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'icon');
            document.head.appendChild(link);
        }
        link.setAttribute('href', dataURL);
    };
    reader.readAsDataURL(blob);
}

async function ensureAppInstalled(lib, appId) {
    const appFile = await cjFileBlob(appId + "/app.jar");

    if (!appFile) {
        const launcherUtil = await lib.pl.zb3.freej2me.launcher.LauncherUtil;

        await launcherUtil.installFromBundle(cheerpjWebRoot + "/apps/", appId);
    }
}

async function init() {
    // Update loading progress
    if (window.loadingProgress) {
        window.loadingProgress.update(10, 'cheerpj');
    }

    display = document.getElementById('display');
    // Use willReadFrequently for better FPS with pixel operations
        screenCtx = display.getContext('2d', { 
        alpha: false,  // Disable alpha for better performance
        desynchronized: true  // Hint for better performance (reduces latency)
    });
    
    // Disable image smoothing for pixel-perfect rendering (important for J2ME games)
    screenCtx.imageSmoothingEnabled = false;

    setListeners();

    window.libmidi = new LibMidi(createUnlockingAudioContext());
    await window.libmidi.init();
    window.libmidi.midiPlayer.addEventListener('end-of-media', e => {
        window.evtQueue.queueEvent({ kind: 'player-eom', player: e.target });
    })
    window.libmedia = new LibMedia();

    if (window.loadingProgress) {
        window.loadingProgress.update(25, 'cheerpj');
    }

    await cheerpjInit({
        enableDebug: false,
        status: "splash", // Only show status during init for better performance
        natives: {
            ...canvasFontNatives,
            ...canvasGraphicsNatives,
            ...gles2Natives,
            ...jsReferenceNatives,
            ...mediaBridgeNatives,
            ...midiBridgeNatives,
            async Java_pl_zb3_freej2me_bridge_shell_Shell_setTitle(lib, title) {
                document.title = title;
            },
            async Java_pl_zb3_freej2me_bridge_shell_Shell_setIcon(lib, iconBytes) {
                if (iconBytes) {
                    setFaviconFromBuffer(iconBytes.buffer);
                }
            },
            async Java_pl_zb3_freej2me_bridge_shell_Shell_getScreenCtx(lib) {
                return screenCtx;
            },
            async Java_pl_zb3_freej2me_bridge_shell_Shell_setCanvasSize(lib, width, height) {
                if (!scaleSet) {
                    // Hide loading and show display
                    if (window.loadingProgress) {
                        window.loadingProgress.complete();
                    } else {
                        document.getElementById('loading').style.display = 'none';
                    }
                    display.style.display = '';
                    scaleSet = true;
                    display.focus();
                }
                screenCtx.canvas.width = width;
                screenCtx.canvas.height = height;
                autoscale();
            },
            async Java_pl_zb3_freej2me_bridge_shell_Shell_waitForAndDispatchEvents(lib, listener) {
                const KeyEvent = await lib.pl.zb3.freej2me.bridge.shell.KeyEvent;
                const PointerEvent = await lib.pl.zb3.freej2me.bridge.shell.PointerEvent;

                const evt = await evtQueue.waitForEvent();
                if (evt.kind == 'keydown') {
                    await listener.keyPressed(await new KeyEvent(...evt.args));
                } else if (evt.kind == 'keyup') {
                    await listener.keyReleased(await new KeyEvent(...evt.args));
                } else if (evt.kind == 'pointerpressed') {
                    await listener.pointerPressed(await new PointerEvent(evt.x, evt.y));
                } else if (evt.kind == 'pointerdragged') {
                    await listener.pointerDragged(await new PointerEvent(evt.x, evt.y));
                } else if (evt.kind == 'pointerreleased') {
                    await listener.pointerReleased(await new PointerEvent(evt.x, evt.y));
                } else if (evt.kind == 'player-eom') {
                    await listener.playerEOM(evt.player);
                } else if (evt.kind == 'player-video-frame') {
                    await listener.playerVideoFrame(evt.player);
                }
            },
            async Java_pl_zb3_freej2me_bridge_shell_Shell_restart(lib) {
                location.reload();
            },
            async Java_pl_zb3_freej2me_bridge_shell_Shell_exit(lib) {
                location.href = './';
            },
            async Java_pl_zb3_freej2me_bridge_shell_Shell_sthop(lib) {
                
            },
            async Java_pl_zb3_freej2me_bridge_shell_Shell_say(lib, sth) {
                console.log('[say]', sth);
            },
            async Java_pl_zb3_freej2me_bridge_shell_Shell_sayObject(lib, label, obj) {
                
                console.log('[sayobject]', label, obj);
            }
        }
    });

    if (window.loadingProgress) {
        window.loadingProgress.update(50, 'emulator');
    }

    const lib = await cheerpjRunLibrary(cheerpjWebRoot + "/freej2me-web.jar");
    
    // Export lib and launcherUtil for external use (e.g., wipe data feature)
    window.cheerpjLib = lib;
    const launcherUtil = await lib.pl.zb3.freej2me.launcher.LauncherUtil;
    window.launcherUtil = launcherUtil;

    if (window.loadingProgress) {
        window.loadingProgress.update(70, 'game');
    }

    const FreeJ2ME = await lib.org.recompile.freej2me.FreeJ2ME;

    let args;
    let currentAppId = null;

    if (sp.get('app')) {
        const app = sp.get('app');
        await ensureAppInstalled(lib, app);
        currentAppId = app;
        args = ['app', sp.get('app')];
    } else {
        const jarPath = cheerpjWebRoot + "/games/" + (sp.get('jar') || "game.jar");
        args = ['jar', jarPath];
        
        // When loading from jar directly, try to get appId from the jar file
        // by using MIDletLoader to analyze the jar
        try {
            const MIDletLoader = await lib.org.recompile.mobile.MIDletLoader;
            const File = await lib.java.io.File;
            const jarFile = await new File(jarPath);
            const loader = await MIDletLoader.getMIDletLoader(jarFile);
            
            if (loader) {
                // Try to get appId from jar metadata
                const appIdFromJar = await loader.getAppId();
                if (appIdFromJar) {
                    currentAppId = appIdFromJar;
                    console.log('[main.js] Got appId from jar:', currentAppId);
                }
            }
        } catch (e) {
            console.log('[main.js] Could not get appId from jar:', e);
            currentAppId = null;
        }
    }
    
    // Export currentAppId for external use (e.g., wipe data feature)
    window.currentAppId = currentAppId;

    if (window.loadingProgress) {
        window.loadingProgress.update(90, 'starting');
    }

    FreeJ2ME.main(args).catch(e => {
        e.printStackTrace();
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.classList.remove('loading-complete');
            loadingEl.style.display = 'flex';
            const textEl = loadingEl.querySelector('.loading-text');
            if (textEl) textEl.textContent = 'Crash :(';
        }
    });


}

init();