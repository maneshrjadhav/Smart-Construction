import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Construction3DHero() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(18, 14, 24);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Controls target
    const target = new THREE.Vector3(0, 5, 0);
    camera.lookAt(target);

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0x0f2b3c, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x27c4e8, 2.5);
    dirLight1.position.set(20, 30, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffb703, 1.2);
    dirLight2.position.set(-20, 15, -15);
    scene.add(dirLight2);

    // Group for the entire construction site
    const siteGroup = new THREE.Group();
    scene.add(siteGroup);

    // 1. Ground Grid Matrix
    const gridHelper = new THREE.GridHelper(26, 26, 0x0fa8c4, 0x143242);
    gridHelper.position.y = 0;
    siteGroup.add(gridHelper);

    // 2. High-Tech Skyscraper Structural Framing (Wireframe + Translucent Slabs)
    const buildingGroup = new THREE.Group();
    siteGroup.add(buildingGroup);

    const floorCount = 7;
    const floorWidth = 7;
    const floorHeight = 1.6;

    // Materials
    const slabMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a2233,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.75,
    });

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x27c4e8,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.9,
    });

    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x0fa8c4,
      metalness: 0.9,
      roughness: 0.1,
    });

    for (let i = 0; i < floorCount; i++) {
      const slabGeo = new THREE.BoxGeometry(floorWidth, 0.2, floorWidth);
      const slabMesh = new THREE.Mesh(slabGeo, slabMaterial);
      slabMesh.position.y = (i + 1) * floorHeight;
      buildingGroup.add(slabMesh);

      const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(slabGeo), edgeMaterial);
      wireframe.position.y = (i + 1) * floorHeight;
      buildingGroup.add(wireframe);

      // 4 Corner Pillars
      const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, floorHeight, 8);
      const corners = [
        [-floorWidth / 2 + 0.3, -floorWidth / 2 + 0.3],
        [floorWidth / 2 - 0.3, -floorWidth / 2 + 0.3],
        [-floorWidth / 2 + 0.3, floorWidth / 2 - 0.3],
        [floorWidth / 2 - 0.3, floorWidth / 2 - 0.3],
      ];

      corners.forEach(([cx, cz]) => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMaterial);
        pillar.position.set(cx, (i + 0.5) * floorHeight, cz);
        buildingGroup.add(pillar);
      });
    }

    // 3. Realistic Tower Crane
    const craneGroup = new THREE.Group();
    craneGroup.position.set(-6.5, 0, 4);
    siteGroup.add(craneGroup);

    const craneMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb703, // Safety Construction Yellow
      metalness: 0.6,
      roughness: 0.4,
    });

    // Crane Vertical Mast (Tower)
    const mastHeight = 15;
    const mastGeo = new THREE.BoxGeometry(0.8, mastHeight, 0.8);
    const mastMesh = new THREE.Mesh(mastGeo, craneMaterial);
    mastMesh.position.y = mastHeight / 2;
    craneGroup.add(mastMesh);

    // Crane Jib (Horizontal boom that rotates)
    const jibGroup = new THREE.Group();
    jibGroup.position.y = mastHeight - 0.5;
    craneGroup.add(jibGroup);

    // Main Jib Arm
    const jibGeo = new THREE.BoxGeometry(16, 0.5, 0.5);
    const jibMesh = new THREE.Mesh(jibGeo, craneMaterial);
    jibMesh.position.x = 4; // extended outwards towards building
    jibGroup.add(jibMesh);

    // Crane Cabin
    const cabinGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x082b3a, metalness: 0.8 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(-0.8, -0.6, 0.4);
    jibGroup.add(cabinMesh);

    // Hook Cable & Load
    const cableGeo = new THREE.CylinderGeometry(0.03, 0.03, 6, 6);
    const cableMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const cableMesh = new THREE.Mesh(cableGeo, cableMat);
    cableMesh.position.set(6, -3, 0);
    jibGroup.add(cableMesh);

    const loadGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const loadMat = new THREE.MeshStandardMaterial({ color: 0x0fa8c4, wireframe: true });
    const loadMesh = new THREE.Mesh(loadGeo, loadMat);
    loadMesh.position.set(6, -6, 0);
    jibGroup.add(loadMesh);

    // 4. Floating Particles (Industrial dust / ambient sparks)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 30;
      positions[i + 1] = Math.random() * 18;
      positions[i + 2] = (Math.random() - 0.5) * 30;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x27c4e8,
      size: 0.25,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    siteGroup.add(particles);

    // Mouse Interaction for Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 0.4;
      targetY = y * 0.2;
    };

    window.addEventListener("mousemove", onMouseMove);

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax easing
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Slow elegant site rotation
      siteGroup.rotation.y = elapsedTime * 0.08 + mouseX;
      siteGroup.rotation.x = mouseY;

      // Crane jib scanning / rotating back and forth smoothly
      jibGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.6 + 0.5;

      // Subtle pulse on particles
      const posArr = particles.geometry.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        posArr[i] += 0.02;
        if (posArr[i] > 18) posArr[i] = 0;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-100 h-100 position-relative"
      style={{ minHeight: "440px", pointerEvents: "auto" }}
    >
      {/* Fallback badge / overlay indicator */}
      <div
        className="position-absolute bottom-0 end-0 m-3 px-2 py-1 rounded-pill small fw-bold text-info"
        style={{
          backgroundColor: "rgba(8, 43, 58, 0.75)",
          border: "1px solid rgba(39, 196, 232, 0.3)",
          backdropFilter: "blur(6px)",
          fontSize: "10px",
          letterSpacing: "1px",
        }}
      >
        <i className="bi bi-box-fill me-1"></i> INTERACTIVE 3D BIM SIMULATION
      </div>
    </div>
  );
}

