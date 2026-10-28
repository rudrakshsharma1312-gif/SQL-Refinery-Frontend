import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Activity, CheckCircle2, Play, Flame, ArrowRight } from "lucide-react";

interface RefineryHero3DProps {
  machineState: "idle" | "refining" | "done";
  onStateChange?: (state: "idle" | "refining" | "done") => void;
  onTriggerRefine?: () => void;
}

export const RefineryHero3D: React.FC<RefineryHero3DProps> = ({
  machineState,
  onStateChange,
  onTriggerRefine,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [internalState, setInternalState] = useState<"idle" | "refining" | "done">(machineState);

  // Sync external state changes
  useEffect(() => {
    setInternalState(machineState);
  }, [machineState]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth;
    const height = container.clientHeight || 340;

    // Scene with warm obsidian tone that complements blush palette
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16171d);
    scene.fog = new THREE.FogExp2(0x16171d, 0.026);

    // Camera
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(18, 14, 18);
    camera.lookAt(0, 1.2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222430, 2.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    dirLight.position.set(12, 22, 10);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xe25c47, 1.2);
    rimLight.position.set(-15, 10, -12);
    scene.add(rimLight);

    // Dynamic point lights - Factotum coral & sage
    const coreLight = new THREE.PointLight(0xe25c47, 3.8, 16);
    coreLight.position.set(0, 2.2, 0);
    scene.add(coreLight);

    const scanPadLight = new THREE.PointLight(0x287452, 0.6, 10);
    scanPadLight.position.set(4.5, 1.2, 0);
    scene.add(scanPadLight);

    // Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(32, 32, 0xe25c47, 0x272935);
    gridHelper.position.y = -0.05;
    rootGroup.add(gridHelper);

    // Machine Base Pedestal
    const baseGeo = new THREE.BoxGeometry(11, 0.6, 5.5);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f212b,
      roughness: 0.65,
      metalness: 0.8,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, 0.3, 0);
    rootGroup.add(baseMesh);

    // Main Chassis
    const chassisGeo = new THREE.BoxGeometry(4.2, 2.8, 3.8);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x272a37,
      roughness: 0.45,
      metalness: 0.85,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.set(0, 2.0, 0);
    rootGroup.add(chassis);

    // Glowing Core Window (Translucent Chamber)
    const coreGeo = new THREE.SphereGeometry(1.0, 32, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xe25c47,
      emissive: 0xd04835,
      emissiveIntensity: 0.85,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const coreSphere = new THREE.Mesh(coreGeo, coreMat);
    coreSphere.position.set(0, 2.2, 0);
    rootGroup.add(coreSphere);

    // Outer Gyro Rings
    const ringGeo = new THREE.TorusGeometry(1.4, 0.05, 16, 64);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xe25c47,
      emissive: 0xe25c47,
      emissiveIntensity: 0.45,
      metalness: 0.9,
    });
    const gyroRing1 = new THREE.Mesh(ringGeo, ringMat1);
    gyroRing1.position.set(0, 2.2, 0);
    rootGroup.add(gyroRing1);

    const gyroRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.04, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0x287452, emissive: 0x287452, emissiveIntensity: 0.25 })
    );
    gyroRing2.position.set(0, 2.2, 0);
    rootGroup.add(gyroRing2);

    // Intake Conveyor (Left)
    const inConveyorGeo = new THREE.BoxGeometry(3.6, 0.25, 1.4);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x14161f, roughness: 0.9 });
    const inConveyor = new THREE.Mesh(inConveyorGeo, beltMat);
    inConveyor.position.set(-3.6, 1.4, 0);
    rootGroup.add(inConveyor);

    // Outfeed Conveyor (Right)
    const outConveyorGeo = new THREE.BoxGeometry(3.6, 0.25, 1.4);
    const outConveyor = new THREE.Mesh(outConveyorGeo, beltMat);
    outConveyor.position.set(3.6, 1.4, 0);
    rootGroup.add(outConveyor);

    // Inspection Scan Pad
    const padGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.15, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x1d2724,
      roughness: 0.4,
      metalness: 0.9,
    });
    const scanPad = new THREE.Mesh(padGeo, padMat);
    scanPad.position.set(4.5, 1.48, 0);
    rootGroup.add(scanPad);

    // Scan Ring Glow
    const scanRing = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.85, 32),
      new THREE.MeshBasicMaterial({ color: 0x287452, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
    );
    scanRing.rotation.x = -Math.PI / 2;
    scanRing.position.set(4.5, 1.57, 0);
    rootGroup.add(scanRing);

    // Animated Query Cubes
    // Input Cubes (Raw SQL)
    const inputCubes: THREE.Mesh[] = [];
    const inCubeGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const inCubeMat = new THREE.MeshStandardMaterial({ color: 0x696f80, roughness: 0.6, metalness: 0.4 });
    for (let i = 0; i < 3; i++) {
      const cube = new THREE.Mesh(inCubeGeo, inCubeMat);
      cube.position.set(-5.0 + i * 1.4, 1.8, 0);
      rootGroup.add(cube);
      inputCubes.push(cube);
    }

    // Output Cubes (Optimized Sage Green SQL)
    const outputCubes: THREE.Mesh[] = [];
    const outCubeGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const outCubeMat = new THREE.MeshStandardMaterial({
      color: 0x287452,
      emissive: 0x287452,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
    });
    for (let i = 0; i < 2; i++) {
      const cube = new THREE.Mesh(outCubeGeo, outCubeMat);
      cube.position.set(2.8 + i * 1.6, 1.8, 0);
      rootGroup.add(cube);
      outputCubes.push(cube);
    }

    // Floating Energy Sparks / Particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4.5;
      positions[i * 3 + 1] = 1.0 + Math.random() * 3.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4.5;
      velocities.push({
        x: (Math.random() - 0.5) * 0.015,
        y: 0.01 + Math.random() * 0.02,
        z: (Math.random() - 0.5) * 0.015,
      });
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xe25c47,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particles);

    // Mouse Parallax Interaction
    let targetRotX = 0;
    let targetRotY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = nx * 0.18;
      targetRotX = -ny * 0.12;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // State dynamic speeds and lighting
      const state = internalState;
      let speedFactor = 1.0;
      if (state === "refining") {
        speedFactor = 3.2;
        coreLight.intensity = 5.8 + Math.sin(time * 12) * 1.5;
        coreMat.emissiveIntensity = 1.2 + Math.sin(time * 14) * 0.4;
        scanPadLight.intensity = 0.4;
      } else if (state === "done") {
        speedFactor = 1.2;
        coreLight.intensity = 2.8;
        coreMat.emissiveIntensity = 0.6;
        scanPadLight.intensity = 3.8 + Math.sin(time * 6) * 1.0;
      } else {
        speedFactor = 1.0;
        coreLight.intensity = 3.2 + Math.sin(time * 3) * 0.5;
        coreMat.emissiveIntensity = 0.7;
        scanPadLight.intensity = 0.5;
      }

      // Parallax smoothing
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.05;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.05;

      // Gyro rings rotation
      gyroRing1.rotation.x += delta * 1.8 * speedFactor;
      gyroRing1.rotation.y += delta * 2.2 * speedFactor;
      gyroRing2.rotation.y += delta * -1.5 * speedFactor;
      gyroRing2.rotation.z += delta * 1.2 * speedFactor;

      // Core sphere gentle breathing
      const scale = 1.0 + Math.sin(time * 4 * (state === "refining" ? 2 : 1)) * 0.05;
      coreSphere.scale.set(scale, scale, scale);

      // Conveyor cubes flow
      inputCubes.forEach((cube, i) => {
        cube.position.x += delta * 0.8 * speedFactor;
        if (cube.position.x > -1.8) {
          cube.position.x = -5.4;
        }
        cube.position.y = 1.7 + Math.sin(time * 3 + i) * 0.04;
      });

      outputCubes.forEach((cube, i) => {
        cube.position.x += delta * 0.9 * speedFactor;
        if (cube.position.x > 5.5) {
          cube.position.x = 2.0;
        }
        cube.position.y = 1.7 + Math.sin(time * 3 + i + 2) * 0.04;
        cube.rotation.y += delta * 0.8;
      });

      // Sparks float upwards
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += velocities[i].y * (speedFactor * 0.8);
        posArray[i * 3] += velocities[i].x;
        posArray[i * 3 + 2] += velocities[i].z;

        if (posArray[i * 3 + 1] > 4.5) {
          posArray[i * 3 + 1] = 1.0;
          posArray[i * 3] = (Math.random() - 0.5) * 3.5;
          posArray[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
        }
      }
      posAttr.needsUpdate = true;

      // Scan ring pulse
      scanRing.scale.setScalar(1.0 + Math.sin(time * 5) * 0.08);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [internalState]);

  const changeState = (s: "idle" | "refining" | "done") => {
    setInternalState(s);
    if (onStateChange) onStateChange(s);
  };

  return (
    <div className="factotum-hero-card p-6 md:p-8 lg:p-10 mb-8 relative overflow-hidden shadow-sm">
      {/* Background Soft Organic Shapes matching Factotum Screenshot */}
      <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-[#FCE5E0] -z-10 pointer-events-none opacity-60 blur-xl" />
      <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[#F8CFCA] -z-10 pointer-events-none opacity-50 blur-2xl" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Text Column inspired by Factotum */}
        <div className="lg:col-span-5 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E25C47] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#E25C47]" />
            <span>NVIDIA × DuckDB Query Studio</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#141519] leading-[1.12]">
              refine <span className="font-serif italic font-normal text-[#E25C47]">'speed'</span> + totum{" "}
              <span className="block font-sans font-extrabold">'the whole query'</span>
            </h1>
            <p className="text-sm md:text-base text-[#575A65] font-medium leading-relaxed pt-2">
              Focus on what you do best while we benchmark the rest. Proposes SQL rewrites with AI,
              independently validates safety, and tests execution speed on DuckDB.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => {
                changeState("refining");
                if (onTriggerRefine) onTriggerRefine();
              }}
              className="btn-ink flex items-center gap-2 text-xs shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Refine Query</span>
            </button>
            <div className="text-xs text-[#696C77] font-medium flex items-center gap-1.5">
              <span>Core principle:</span>
              <span className="text-[#141519] font-semibold">AI proposes. Measurements decide.</span>
            </div>
          </div>
        </div>

        {/* Right 3D Stage Column */}
        <div className="lg:col-span-7">
          <div className="relative w-full h-[320px] md:h-[350px] rounded-[24px] overflow-hidden bg-[#16171D] border border-[#2B2D38] shadow-2xl group">
            {/* Three.js Canvas Container */}
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Subtle Vignette Overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 50%, transparent 45%, rgba(22, 23, 29, 0.9) 100%)",
                boxShadow: "inset 0 0 80px rgba(22, 23, 29, 0.95)",
              }}
            />

            {/* Top Left Tag */}
            <div className="absolute top-4 left-5 z-20 pointer-events-none select-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white backdrop-blur-md border border-white/15">
                <Sparkles className="w-3 h-3 text-[#E25C47]" />
                Interactive 3D Engine
              </span>
            </div>

            {/* Top Right Holographic HUD */}
            <div className="absolute top-4 right-5 z-20 bg-[#1D1F2A]/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 min-w-[175px] pointer-events-none shadow-xl select-none">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                <span>Machine Core</span>
                <span
                  className={
                    internalState === "refining"
                      ? "text-[#E25C47] flex items-center gap-1 font-mono font-bold"
                      : internalState === "done"
                      ? "text-[#3DFF8A] flex items-center gap-1 font-mono font-bold"
                      : "text-slate-400 font-mono"
                  }
                >
                  {internalState === "refining" && <Flame className="w-3 h-3 animate-bounce" />}
                  {internalState === "done" && <CheckCircle2 className="w-3 h-3" />}
                  {internalState.toUpperCase()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-500 ${
                    internalState === "refining"
                      ? "w-[85%] bg-gradient-to-r from-[#E25C47] to-amber-300 animate-pulse"
                      : internalState === "done"
                      ? "w-[100%] bg-gradient-to-r from-emerald-500 to-[#3DFF8A]"
                      : "w-[25%] bg-slate-600"
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                <span>Speed:</span>
                <span className="text-white font-semibold">
                  {internalState === "refining" ? "3.20x" : internalState === "done" ? "1.20x" : "1.00x"}
                </span>
              </div>
            </div>

            {/* Bottom Right Interactive State Controls */}
            <div className="absolute bottom-4 right-5 z-20 flex items-center gap-1.5 bg-[#14151C]/90 backdrop-blur-lg border border-white/10 px-2 py-1.5 rounded-full shadow-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                State:
              </span>
              <button
                onClick={() => changeState("idle")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none ${
                  internalState === "idle"
                    ? "bg-white/15 text-white border border-white/20 shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Play className="w-3 h-3" />
                Idle
              </button>
              <button
                onClick={() => changeState("refining")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#E25C47]/50 focus-visible:outline-none ${
                  internalState === "refining"
                    ? "bg-[#E25C47]/20 text-[#E25C47] border border-[#E25C47]/50 shadow-[0_0_12px_rgba(226,92,71,0.3)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Activity className="w-3 h-3" />
                Refining
              </button>
              <button
                onClick={() => changeState("done")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:outline-none ${
                  internalState === "done"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_12px_rgba(40,116,82,0.3)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
