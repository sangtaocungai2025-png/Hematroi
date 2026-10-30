document.addEventListener('DOMContentLoaded', () => {

    // --- BIẾN TRẠNG THÁI (Giữ nguyên) ---
    let isPaused = false;
    let simulationTime = 0; 

    // --- DỮ LIỆU CÁC HÀNH TINH (Giữ nguyên) ---
    const planetData = {
        mercury: { name: "Sao Thủy", emoji: "☄️", color: 0xB0AFAF, size: 0.38, orbitRadius: 0.39, period: 0.24, features: "Không khí quyển, biên độ nhiệt rất lớn (−170°C đến +430°C). Nhiều hố va chạm." },
        venus: { name: "Sao Kim", emoji: "🌕", color: 0xF5DEB3, size: 0.95, orbitRadius: 0.72, period: 0.62, features: "Khí quyển CO₂ dày đặc, hiệu ứng nhà kính cực mạnh (~470°C). Quay ngược chiều." },
        earth: { name: "Trái Đất", emoji: "🌍", color: 0x4682B4, size: 1.00, orbitRadius: 1.00, period: 1.00, features: "Có nước lỏng và khí quyển duy trì sự sống. Có 1 Mặt Trăng." },
        mars: { name: "Sao Hỏa", emoji: "🔴", color: 0xE57373, size: 0.53, orbitRadius: 1.52, period: 1.88, features: "Có 2 vệ tinh nhỏ. Có núi lửa lớn nhất hệ (Olympus Mons). Từng có nước lỏng." },
        jupiter: { name: "Sao Mộc", emoji: "🪐", color: 0xD2B48C, size: 11.2, orbitRadius: 5.20, period: 11.86, features: "Hành tinh lớn nhất. Có 'Vết Đỏ Lớn' (bão). Chủ yếu là khí Hydro và Heli." },
        saturn: { name: "Sao Thổ", emoji: "🌀", color: 0xF0E68C, size: 9.45, orbitRadius: 9.58, period: 29.46, features: "Có hệ thống vòng rõ và đẹp nhất (băng, bụi, đá). Mật độ rất nhỏ." },
        uranus: { name: "Sao Thiên Vương", emoji: "🌀", color: 0xAFEEEE, size: 4.0, orbitRadius: 19.22, period: 84.0, features: "Quay ngang trục (gần như 'lăn' quanh Mặt Trời). Có methane tạo màu xanh." },
        neptune: { name: "Sao Hải Vương", emoji: "🔵", color: 0x00008B, size: 3.9, orbitRadius: 30.05, period: 164.8, features: "Hành tinh xa nhất. Có gió mạnh nhất Hệ Mặt Trời (hơn 2000 km/h)." }
    };

    // --- CÀI ĐẶT CƠ BẢN CỦA THREE.JS (Giữ nguyên) ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000); 
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    camera.position.set(0, 150, 400); 
    camera.lookAt(0, 0, 0); 

    // --- ÁNH SÁNG (Giữ nguyên) ---
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 3000);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    // --- MẶT TRỜI (Giữ nguyên) ---
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32); 
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF33 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // --- HÀNH TINH VÀ QUỸ ĐẠO (CẬP NHẬT) ---
    
    // CẬP NHẬT 1: Tạo một NHÓM (Group) để chứa các hành tinh
    const planetsGroup = new THREE.Group();
    scene.add(planetsGroup); // Thêm nhóm này vào cảnh
    
    // const planetMeshes = {}; // Chúng ta không cần biến này nữa
    const orbits = {};
    const DISTANCE_SCALE = 10; 
    const SIZE_SCALE = 0.3;   

    for (const key in planetData) {
        const data = planetData[key];
        const planetGeometry = new THREE.SphereGeometry(data.size * SIZE_SCALE, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.5, metalness: 0.1 });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        
        planet.name = key; // Đặt tên cho hành tinh (RẤT QUAN TRỌNG)
        
        // CẬP NHẬT 2: Thêm hành tinh vào NHÓM, không phải vào scene
        planetsGroup.add(planet); 

        const orbitRadius = data.orbitRadius * DISTANCE_SCALE;
        const points = [];
        const divisions = 128;
        for (let i = 0; i <= divisions; i++) {
            const angle = (i / divisions) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius));
        }
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const orbitMaterial = new THREE.LineDashedMaterial({ color: 0x666666, dashSize: 1.5, gapSize: 1, transparent: true, opacity: 0.5 });
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        orbit.computeLineDistances();
        scene.add(orbit); // Quỹ đạo thì vẫn thêm vào scene
        orbits[key] = orbit;
        planet.position.x = orbitRadius; // Đặt vị trí ban đầu
    }
    
    // Thêm vành đai Sao Thổ (như cũ, nhưng thêm vào hành tinh trong nhóm)
    const saturnRingGeometry = new THREE.RingGeometry((planetData.saturn.size * SIZE_SCALE) * 1.5, (planetData.saturn.size * SIZE_SCALE) * 2.5, 64);
    const saturnRingMaterial = new THREE.MeshBasicMaterial({ color: 0xAAAAAA, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
    saturnRing.rotation.x = Math.PI / 2;
    saturnRing.rotation.y = Math.PI / 6;
    
    // Tìm Sao Thổ trong nhóm và thêm vành đai vào
    planetsGroup.getObjectByName('saturn').add(saturnRing);

    // --- ĐIỀU KHIỂN CAMERA BẰNG CHUỘT (Giữ nguyên) ---
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const toRadians = (angle) => angle * (Math.PI / 180);
    renderer.domElement.addEventListener('mousedown', (e) => { isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; });
    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaMove = { x: e.clientX - previousMousePosition.x, y: e.clientY - previousMousePosition.y };
        scene.rotation.y += toRadians(deltaMove.x * 0.5);
        scene.rotation.x += toRadians(deltaMove.y * 0.5);
        scene.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, scene.rotation.x));
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    renderer.domElement.addEventListener('mouseup', () => { isDragging = false; });
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        if (e.deltaY < 0) { camera.position.multiplyScalar(1 - zoomSpeed); } else { camera.position.multiplyScalar(1 + zoomSpeed); }
        if (camera.position.length() < 1) camera.position.setLength(1); 
        if (camera.position.length() > 1000) camera.position.setLength(1000); 
    });

    // --- RAYCASTING (Di chuột vào hành tinh) (VIẾT LẠI HOÀN TOÀN) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const infoBox = document.getElementById('info-box'); // Lấy đúng ID
    let highlightedPlanet = null;

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        // CẬP NHẬT 3: Dò tìm các đối tượng trong NHÓM HÀNH TINH
        // 'true' nghĩa là dò tìm cả bên trong (ví dụ: vành đai Sao Thổ)
        const intersects = raycaster.intersectObjects(planetsGroup.children, true);

        if (intersects.length > 0) {
            // Lấy đối tượng đầu tiên va chạm
            let intersectedObject = intersects[0].object;

            // CẬP NHẬT 4: Xử lý trường hợp vành đai Sao Thổ
            // Nếu thứ ta chạm vào không có tên (như vành đai),
            // chúng ta sẽ đi lên 'cha' của nó cho đến khi tìm thấy hành tinh
            while (intersectedObject.parent && !intersectedObject.name) {
                intersectedObject = intersectedObject.parent;
            }

            // Bây giờ 'intersectedObject' chắc chắn là hành tinh (ví dụ: Sao Thổ)
            
            if (highlightedPlanet !== intersectedObject) {
                // Bỏ highlight hành tinh cũ (nếu có)
                if (highlightedPlanet) {
                    highlightedPlanet.material.emissive.setHex(0x000000);
                }
                
                // Đặt hành tinh mới là 'highlighted'
                highlightedPlanet = intersectedObject;
                highlightedPlanet.material.emissive.setHex(0x333333); // Làm nó sáng nhẹ

                // Lấy dữ liệu
                const data = planetData[highlightedPlanet.name];
                
                // Hiển thị thông tin
                if (data && infoBox) {
                    infoBox.innerHTML = `
                        <h3>${data.name} ${data.emoji}</h3>
                        <ul>
                            <li><strong>Kích thước:</strong> ${data.size} lần Trái Đất</li>
                            <li><strong>Bán kính quỹ đạo:</strong> ${data.orbitRadius} AU</li>
                            <li><strong>Chu kì quay (Mặt Trời):</strong> ${data.period} năm</li>
                            <li><strong>Đặc điểm riêng:</strong> ${data.features}</li>
                        </ul>
                        <p class="hint">Kéo chuột để xoay khung nhìn.</p>
                    `;
                    infoBox.style.display = 'block';
                }
            }
        } else {
            // Nếu không va chạm với gì
            if (highlightedPlanet) {
                // Bỏ highlight hành tinh cũ
                highlightedPlanet.material.emissive.setHex(0x000000);
                highlightedPlanet = null;
            }
            // Ẩn hộp thông tin
            if (infoBox) {
                infoBox.style.display = 'none';
            }
        }
    }
    window.addEventListener('mousemove', onMouseMove);
    // --- KẾT THÚC VIẾT LẠI ---

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- GÁN SỰ KIỆN CHO NÚT BẤM (Giữ nguyên) ---
    document.getElementById('startButton').addEventListener('click', () => {
        isPaused = false;
    });
    document.getElementById('pauseButton').addEventListener('click', () => {
        isPaused = true;
    });

    // --- ANIMATION LOOP (CẬP NHẬT) ---
    const earthSimPeriod = 3;
    const clock = new THREE.Clock(); 

    function animate() {
        requestAnimationFrame(animate); 
        const delta = clock.getDelta();
        if (!isPaused) {
            simulationTime += delta; 
            
            // CẬP NHẬT 5: Quay các hành tinh trong nhóm
            planetsGroup.children.forEach(planet => {
                const data = planetData[planet.name];
                if (data) { // Chỉ di chuyển nếu nó là hành tinh có dữ liệu
                    const orbitRadius = data.orbitRadius * DISTANCE_SCALE;
                    const angle = simulationTime * ( (2 * Math.PI) / (data.period * earthSimPeriod) );
                    planet.position.x = Math.cos(angle) * orbitRadius;
                    planet.position.z = Math.sin(angle) * orbitRadius;
                }
            });
        }
        renderer.render(scene, camera);
    }
    
    animate();
});