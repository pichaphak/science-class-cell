/* micro3d.js v6 – loads GLB from embedded base64 (works on file://) */
(function () {
  function init() {
    var canvas = document.getElementById('micro3d');
    if (!canvas || typeof THREE === 'undefined') return;

    var wrap = canvas.parentElement;
    var W = wrap.clientWidth  || 340;
    var H = wrap.clientHeight || 408;

    /* ── Renderer ─────────────────────────────────────────────── */
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled   = true;
    renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputEncoding      = THREE.sRGBEncoding;

    /* ── Scene + Camera ──────────────────────────────────────── */
    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 200);
    camera.position.set(0, 1.2, 4.5);
    camera.lookAt(0, 0, 0);

    /* ── Lights ──────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.80));

    var sun = new THREE.DirectionalLight(0xfff8f0, 2.0);
    sun.position.set(4, 8, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near   = 0.5;
    sun.shadow.camera.far    = 40;
    sun.shadow.camera.top    =  5;
    sun.shadow.camera.bottom = -5;
    sun.shadow.camera.left   = -5;
    sun.shadow.camera.right  =  5;
    scene.add(sun);

    var fill = new THREE.DirectionalLight(0xddeeff, 0.55);
    fill.position.set(-5, 4, -3);
    scene.add(fill);

    var goldPt = new THREE.PointLight(0xF0B92B, 1.0, 20);
    goldPt.position.set(-3, 5, 2);
    scene.add(goldPt);

    var rimPt = new THREE.PointLight(0xaaddff, 0.45, 15);
    rimPt.position.set(4, 6, -4);
    scene.add(rimPt);

    /* ── Ground shadow ───────────────────────────────────────── */
    var gnd = new THREE.Mesh(
      new THREE.CircleGeometry(3.5, 48),
      new THREE.ShadowMaterial({ opacity: 0.20 })
    );
    gnd.rotation.x  = -Math.PI / 2;
    gnd.position.y  = -1.8;
    gnd.receiveShadow = true;
    scene.add(gnd);

    /* ── Bokeh particles ─────────────────────────────────────── */
    var pBuf = new Float32Array(70 * 3);
    for (var i = 0; i < 70; i++) {
      pBuf[i*3]   = (Math.random() - 0.5) * 8;
      pBuf[i*3+1] = Math.random() * 6 - 1;
      pBuf[i*3+2] = (Math.random() - 0.5) * 5 - 1.5;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pBuf, 3));
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0xF0B92B, size: 0.055, transparent: true, opacity: 0.45
    })));

    /* ── Model group ─────────────────────────────────────────── */
    var scope = new THREE.Group();
    scene.add(scope);

    /* ── Loading overlay ─────────────────────────────────────── */
    var loadDiv = document.createElement('div');
    loadDiv.style.cssText = [
      'position:absolute','inset:0','display:flex','flex-direction:column',
      'align-items:center','justify-content:center',
      'color:rgba(255,255,255,.75)','font-family:Sarabun,sans-serif',
      'font-size:13px','pointer-events:none','gap:8px'
    ].join(';');
    loadDiv.innerHTML = '<span>⏳ กำลังโหลดโมเดล…</span>';
    wrap.style.position = 'relative';
    wrap.appendChild(loadDiv);

    /* ── base64 → ArrayBuffer ────────────────────────────────── */
    function b64ToBuffer(b64) {
      var bin = atob(b64);
      var buf = new ArrayBuffer(bin.length);
      var u8  = new Uint8Array(buf);
      for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return buf;
    }

    /* ── Parse GLB from embedded data ───────────────────────── */
    function parseGLB() {
      if (typeof THREE.GLTFLoader === 'undefined') {
        setTimeout(parseGLB, 200);
        return;
      }
      if (!window.MICROSCOPE_GLB_B64) {
        loadDiv.innerHTML = [
          '<span>⚠️ ไม่พบข้อมูลโมเดล</span>',
          '<small style="opacity:.6;font-size:11px;text-align:center">',
          'กรุณารัน embed_glb.py ก่อน<br>',
          'python "D:\\Work หนองหานวิทยา\\embed_glb.py"',
          '</small>'
        ].join('');
        return;
      }

      loadDiv.innerHTML = '<span>🔄 กำลังประมวลผลโมเดล…</span>';

      // decode on next tick so UI can update
      setTimeout(function () {
        try {
          var buf = b64ToBuffer(window.MICROSCOPE_GLB_B64);
          var loader = new THREE.GLTFLoader();
          loader.parse(
            buf, '',
            /* onLoad */
            function (gltf) {
              var model = gltf.scene;
              model.traverse(function (obj) {
                if (obj.isMesh) {
                  obj.castShadow    = true;
                  obj.receiveShadow = true;
                }
              });

              // auto-center + scale
              var box    = new THREE.Box3().setFromObject(model);
              var center = box.getCenter(new THREE.Vector3());
              var size   = box.getSize(new THREE.Vector3());
              var maxDim = Math.max(size.x, size.y, size.z);
              var scale  = 3.2 / maxDim;
              model.scale.setScalar(scale);
              model.position.set(
                -center.x * scale,
                -center.y * scale,
                -center.z * scale
              );
              scope.add(model);

              if (loadDiv.parentElement) loadDiv.parentElement.removeChild(loadDiv);
            },
            /* onError */
            function (err) {
              console.error('GLB parse error:', err);
              loadDiv.innerHTML = '<span>❌ โหลดโมเดลไม่สำเร็จ</span><small style="opacity:.6;font-size:11px">' + err + '</small>';
            }
          );
        } catch (e) {
          console.error(e);
          loadDiv.innerHTML = '<span>❌ ' + e.message + '</span>';
        }
      }, 50);
    }

    parseGLB();

    /* ── Interaction ─────────────────────────────────────────── */
    var dragging = false, lx = 0, ly = 0;
    var rotY = -0.3, rotX = 0.05, tY = -0.3, tX = 0.05;

    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', function (e) {
      dragging = true; lx = e.clientX; ly = e.clientY;
      canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup',   function ()  { dragging = false; canvas.style.cursor = 'grab'; });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      tY += (e.clientX - lx) * 0.013; lx = e.clientX;
      tX += (e.clientY - ly) * 0.009; ly = e.clientY;
      tX = Math.max(-0.42, Math.min(0.52, tX));
    });
    canvas.addEventListener('touchstart', function (e) {
      dragging = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY;
    }, { passive: true });
    canvas.addEventListener('touchend',   function ()  { dragging = false; });
    canvas.addEventListener('touchmove',  function (e) {
      if (!dragging) return;
      tY += (e.touches[0].clientX - lx) * 0.015; lx = e.touches[0].clientX;
      tX += (e.touches[0].clientY - ly) * 0.010; ly = e.touches[0].clientY;
      tX = Math.max(-0.42, Math.min(0.52, tX));
    }, { passive: true });

    /* ── Animate ─────────────────────────────────────────────── */
    var t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.01;
      if (!dragging) tY += 0.004;
      rotY += (tY - rotY) * 0.065;
      rotX += (tX - rotX) * 0.065;
      scope.rotation.y = rotY;
      scope.rotation.x = rotX;
      scope.position.y = Math.sin(t * 0.7) * 0.05;
      goldPt.intensity = 0.85 + Math.sin(t * 1.4) * 0.22;
      renderer.render(scene, camera);
    }
    animate();

    /* ── Resize ──────────────────────────────────────────────── */
    function resize() {
      W = wrap.clientWidth; H = wrap.clientHeight;
      if (!W || !H) return;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    setTimeout(resize, 150);
  }

  function tryInit() {
    if (typeof THREE !== 'undefined' && document.readyState !== 'loading') init();
    else setTimeout(tryInit, 150);
  }
  tryInit();
})();
