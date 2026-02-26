// ============================================================
// app.js — Sistema de Citas Médicas
// FET 2026
// ============================================================

// ── ESTADO GLOBAL ──
const state = {
  especialidades: [
    { id: 1, nombre: "Psiquiatría del Sueño",              descripcion: "Atiende a quienes pueden dormir todo el día y les falta todavía" },
    { id: 2, nombre: "Therianthropía y Conocimiento del Ser", descripcion: "Atención psicológica y adoctrinamiento" },
    { id: 3, nombre: "Descoordinación Aguda",              descripcion: "Terapia Intensiva para Ranked" }
  ],
  medicos: [
    { id: 1, nombre: "Kevin Villa",  especialidadId: 1 },
    { id: 2, nombre: "Harold Lopez", especialidadId: 2 },
    { id: 3, nombre: "Laura Agredo", especialidadId: 3 }
  ],
  pacientes: [],
  citas: [],
  contadores: { pacientes: 1, citas: 1 },
  citaSeleccionada: null
};

// ── UTILIDADES ──

/** Busca una especialidad por ID */
function getEsp(id) {
  return state.especialidades.find(e => e.id === id);
}

/** Busca un médico por ID */
function getMed(id) {
  return state.medicos.find(m => m.id === id);
}

/** Busca un paciente por ID */
function getPac(id) {
  return state.pacientes.find(p => p.id === id);
}

/** Muestra una alerta temporal en el elemento con el ID dado */
function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  el.className = `alert alert-${type} show`;
  el.innerHTML = (type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️') + ' ' + msg;
  setTimeout(() => el.classList.remove('show'), 3500);
}

/** Genera el HTML de un badge según el estado de la cita */
function badgeEstado(estado) {
  if (estado === 'Activa')       return `<span class="badge badge-active">Activa</span>`;
  if (estado === 'Cancelada')    return `<span class="badge badge-cancelled">Cancelada</span>`;
  if (estado === 'Reprogramada') return `<span class="badge badge-reprogrammed">Reprogramada</span>`;
  return estado;
}

/** Actualiza los contadores del encabezado */
function updateStats() {
  document.getElementById('stat-pacientes').textContent = state.pacientes.length;
  document.getElementById('stat-activas').textContent   = state.citas.filter(c => c.estado === 'Activa').length;
  document.getElementById('stat-total').textContent     = state.citas.length;
}

/** Genera una fila de "tabla vacía" con un mensaje */
function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}">
    <div class="empty-state">
      <div class="empty-icon">📭</div>${msg}
    </div>
  </td></tr>`;
}

// ── PESTAÑAS ──

/**
 * Cambia el panel visible y actualiza el botón activo.
 * @param {string} name - nombre del panel a mostrar
 * @param {HTMLElement} btn - botón que fue clickeado
 */
function switchTab(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  btn.classList.add('active');

  if (name === 'citas')     rellenarSelectsCita();
  if (name === 'historial') rellenarSelectHistorial();
  if (name === 'todas')     renderTodasCitas();
  if (name === 'medicos')   renderMedicos();
}

// ── PACIENTES ──

/** Registra un nuevo paciente con los datos del formulario */
function registrarPaciente() {
  const nombre    = document.getElementById('p-nombre').value.trim();
  const documento = document.getElementById('p-documento').value.trim();
  const telefono  = document.getElementById('p-telefono').value.trim();

  if (!nombre || !documento || !telefono)
    return showAlert('alert-paciente', 'Todos los campos son obligatorios.', 'error');

  if (state.pacientes.find(p => p.documento === documento))
    return showAlert('alert-paciente', `Ya existe un paciente con el documento ${documento}.`, 'error');

  const p = { id: state.contadores.pacientes++, nombre, documento, telefono };
  state.pacientes.push(p);
  showAlert('alert-paciente', `Paciente "${nombre}" registrado con ID ${p.id}.`, 'success');
  ['p-nombre', 'p-documento', 'p-telefono'].forEach(id => document.getElementById(id).value = '');
  renderPacientes();
  updateStats();
}

/** Renderiza la tabla de pacientes */
function renderPacientes() {
  const tbody = document.getElementById('tbody-pacientes');
  if (!state.pacientes.length) {
    tbody.innerHTML = emptyRow(4, 'No hay pacientes registrados.');
    return;
  }
  tbody.innerHTML = state.pacientes.map(p =>
    `<tr>
      <td>${p.id}</td>
      <td>${p.nombre}</td>
      <td>${p.documento}</td>
      <td>${p.telefono}</td>
    </tr>`
  ).join('');
}

// ── SELECTS PARA CITAS ──

/** Rellena los selects del panel de asignar cita */
function rellenarSelectsCita() {
  const selP = document.getElementById('c-paciente');
  selP.innerHTML = state.pacientes.length
    ? state.pacientes.map(p => `<option value="${p.id}">${p.nombre} (${p.documento})</option>`).join('')
    : '<option value="">— Sin pacientes registrados —</option>';

  const selE = document.getElementById('c-especialidad');
  selE.innerHTML = state.especialidades.map(e =>
    `<option value="${e.id}">${e.nombre}</option>`
  ).join('');

  filtrarMedicos();
}

/** Filtra el select de médicos según la especialidad seleccionada */
function filtrarMedicos() {
  const idE = parseInt(document.getElementById('c-especialidad').value);
  const disponibles = state.medicos.filter(m => m.especialidadId === idE);
  const selM = document.getElementById('c-medico');
  selM.innerHTML = disponibles.length
    ? disponibles.map(m => `<option value="${m.id}">Dr(a). ${m.nombre}</option>`).join('')
    : '<option value="">— Sin médicos disponibles —</option>';
}

/** Crea una nueva cita con los datos del formulario */
function asignarCita() {
  const idP   = parseInt(document.getElementById('c-paciente').value);
  const idE   = parseInt(document.getElementById('c-especialidad').value);
  const idM   = parseInt(document.getElementById('c-medico').value);
  const fecha = document.getElementById('c-fecha').value;

  if (!idP || !idM || !fecha)
    return showAlert('alert-cita', 'Completa todos los campos.', 'error');

  const pac = getPac(idP), med = getMed(idM);
  if (!pac || !med)
    return showAlert('alert-cita', 'Paciente o médico no encontrado.', 'error');

  const [y, m, d] = fecha.split('-');
  const fechaStr = `${d}/${m}/${y}`;

  const c = { id: state.contadores.citas++, pacienteId: idP, medicoId: idM, fecha: fechaStr, estado: 'Activa' };
  state.citas.push(c);
  showAlert('alert-cita', `Cita #${c.id} asignada: ${pac.nombre} con Dr(a). ${med.nombre} el ${fechaStr}.`, 'success');
  document.getElementById('c-fecha').value = '';
  updateStats();
}

// ── HISTORIAL ──

/** Rellena el select de pacientes en el panel de historial */
function rellenarSelectHistorial() {
  const sel = document.getElementById('h-paciente');
  sel.innerHTML = state.pacientes.length
    ? '<option value="">— Selecciona un paciente —</option>' +
      state.pacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')
    : '<option value="">— Sin pacientes registrados —</option>';
  document.getElementById('card-historial').style.display = 'none';
}

/** Muestra el historial de citas del paciente seleccionado */
function verHistorial() {
  const idP = parseInt(document.getElementById('h-paciente').value);
  if (!idP) {
    document.getElementById('card-historial').style.display = 'none';
    return;
  }

  const historial = state.citas.filter(c => c.pacienteId === idP);
  const tbody = document.getElementById('tbody-historial');
  document.getElementById('card-historial').style.display = 'block';

  if (!historial.length) {
    tbody.innerHTML = emptyRow(5, 'Este paciente no tiene citas registradas.');
    return;
  }

  tbody.innerHTML = historial.map(c => {
    const med = getMed(c.medicoId);
    const esp = getEsp(med.especialidadId);
    return `<tr>
      <td>${c.id}</td>
      <td>Dr(a). ${med.nombre}</td>
      <td>${esp.nombre}</td>
      <td>${c.fecha}</td>
      <td>${badgeEstado(c.estado)}</td>
    </tr>`;
  }).join('');
}

// ── TODAS LAS CITAS ──

/** Renderiza la tabla con todas las citas y sus acciones */
function renderTodasCitas() {
  const tbody = document.getElementById('tbody-todas');
  if (!state.citas.length) {
    tbody.innerHTML = emptyRow(7, 'No hay citas registradas.');
    return;
  }

  tbody.innerHTML = state.citas.map(c => {
    const pac = getPac(c.pacienteId);
    const med = getMed(c.medicoId);
    const esp = getEsp(med.especialidadId);

    const acciones = c.estado !== 'Cancelada'
      ? `<div style="display:flex;gap:6px;">
          <button class="btn btn-danger btn-sm"  onclick="cancelarCita(${c.id})">✕ Cancelar</button>
          <button class="btn btn-warning btn-sm" onclick="abrirReprogramar(${c.id})">↺ Reprogramar</button>
        </div>`
      : `<span style="color:var(--text-muted);font-size:0.78rem">—</span>`;

    return `<tr>
      <td>${c.id}</td>
      <td>${pac.nombre}</td>
      <td>Dr(a). ${med.nombre}</td>
      <td>${esp.nombre}</td>
      <td>${c.fecha}</td>
      <td>${badgeEstado(c.estado)}</td>
      <td>${acciones}</td>
    </tr>`;
  }).join('');
}

/** Cancela una cita por ID */
function cancelarCita(id) {
  const c = state.citas.find(x => x.id === id);
  if (!c || c.estado === 'Cancelada') return;
  c.estado = 'Cancelada';
  renderTodasCitas();
  updateStats();
}

/** Abre el modal de reprogramar para la cita indicada */
function abrirReprogramar(id) {
  state.citaSeleccionada = id;
  const c   = state.citas.find(x => x.id === id);
  const pac = getPac(c.pacienteId);
  const med = getMed(c.medicoId);
  document.getElementById('modal-cita-info').textContent =
    `Cita #${c.id} — ${pac.nombre} con Dr(a). ${med.nombre} (actual: ${c.fecha})`;
  document.getElementById('modal-nueva-fecha').value = '';
  document.getElementById('modal-reprogram').classList.add('open');
}

/** Cierra el modal de reprogramar */
function cerrarModal() {
  document.getElementById('modal-reprogram').classList.remove('open');
}

/** Confirma la nueva fecha para la cita seleccionada */
function confirmarReprogramar() {
  const fecha = document.getElementById('modal-nueva-fecha').value;
  if (!fecha) return;
  const c = state.citas.find(x => x.id === state.citaSeleccionada);
  const [y, m, d] = fecha.split('-');
  c.fecha  = `${d}/${m}/${y}`;
  c.estado = 'Reprogramada';
  cerrarModal();
  renderTodasCitas();
  updateStats();
}

// ── MÉDICOS ──

/** Renderiza la tabla de médicos disponibles */
function renderMedicos() {
  const tbody = document.getElementById('tbody-medicos');
  tbody.innerHTML = state.medicos.map(m => {
    const esp = getEsp(m.especialidadId);
    return `<tr>
      <td>${m.id}</td>
      <td>Dr(a). ${m.nombre}</td>
      <td>${esp.nombre}</td>
      <td style="color:var(--text-dim);font-size:0.82rem">${esp.descripcion}</td>
    </tr>`;
  }).join('');
}

// ── INICIALIZACIÓN ──
renderPacientes();
renderMedicos();
updateStats();
