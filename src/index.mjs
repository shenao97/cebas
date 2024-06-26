const moment = require("moment");

const controllerId = process.env.CONTROLLER_ID
const deviceId = process.env.DEVICE_ID
const url = `${process.env.API_URL}/backend/STH/v1/contextEntities/type/Device/id/${controllerId}/attributes/${deviceId}`;
const authToken = process.env.API_KEY;

apiUrl = 'http://localhost:5000/api'

let nextIrrigations = [];
const dayInMs = (24 * 60 * 60 * 1000);

//----------------------------------------------------------------------//

setupInitialConfig();
document.getElementById("parcelConfigForm").addEventListener("submit", handleConfigFormSubmit);
document.getElementById("irrigationForm").addEventListener("submit", handleIrrigationFormSubmit);
window.addEventListener('load', getIrrigationsList);

document.addEventListener("DOMContentLoaded", function() {
  const resetButton = document.getElementById("resetButton");
  const getSensorDataButton = document.getElementById("getSensorData");

  resetButton.addEventListener("click", function(event) {
    event.stopPropagation();
    resetInitialConfig();
  });

  getSensorDataButton.addEventListener("click", function(event) {
    event.stopPropagation();
    fetchData(authToken, url);
  });

  updateInitialConfigButton();
});

function setupInitialConfig() {
  let initialParcelConfig = JSON.parse(localStorage.getItem('initialParcelConfig')) || {};

  const configFields = [
    'rootsL', 'drainL', 'aRootsTimelapse', 'aDrainTimelapse', 'percentageIncrement',
    'rootsLThreshold', 'drainLThreshold', 'baseIrrigation', 'minIrrigationTimeMin',
    'maxIrrigationTimeMin', 'startTime1', 'startTime2', 'startTime3', 'initialDate'
  ];

  configFields.forEach(field => {
    let fieldValue = initialParcelConfig.config && initialParcelConfig.config[field];
    if (fieldValue !== undefined && fieldValue !== null) {
      document.getElementById(field).value = fieldValue;
    }
  });
}

function getFormDataFromFields(fieldNames) {
  const formData = {};
  fieldNames.forEach(fieldName => {
    if (fieldName === "rootsL" || fieldName === "drainL" || fieldName === "aRootsTimelapse" || fieldName === "aDrainTimelapse" ||
      fieldName === "percentageIncrement" || fieldName === "baseIrrigation" || fieldName === "minIrrigationTimeMin" ||
      fieldName === "maxIrrigationTimeMin") {
      formData[fieldName] = parseInt(document.getElementById(fieldName).value);
    } else if (fieldName === "rootsLThreshold" || fieldName === "drainLThreshold") {
      formData[fieldName] = parseFloat(document.getElementById(fieldName).value);
    } else {
      formData[fieldName] = document.getElementById(fieldName).value;
    }
  });
  return formData;
}

function handleConfigFormSubmit(event) {
  event.preventDefault();
  const fieldNames = [
    'rootsL', 'drainL', 'aRootsTimelapse', 'aDrainTimelapse', 'percentageIncrement',
    'rootsLThreshold', 'drainLThreshold', 'baseIrrigation', 'minIrrigationTimeMin',
    'maxIrrigationTimeMin', 'startTime1', 'startTime2', 'startTime3', 'initialDate'
  ];
  const formData = getFormDataFromFields(fieldNames);

  const initialParcelConfig = {
    parcelName: 'test',
    configFilled: false,
    config: formData
  };

  const existingConfig = localStorage.getItem('initialParcelConfig');

  if (!existingConfig) {
    // Save new configuration to backend
    fetch(`${apiUrl}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': authToken
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Configuración inicial guardada:', data);
      localStorage.setItem('initialParcelConfig', JSON.stringify({ ...initialParcelConfig, _id: data.data._id }));
      setupInitialIrrigation(initialParcelConfig);
    })
    .catch(error => {
      console.error('Error al guardar la configuración inicial:', error);
    });
  } else {
    // Update existing configuration
    const configId = JSON.parse(existingConfig)._id;
    fetch(`${apiUrl}/config/${configId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': authToken
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Configuración inicial actualizada:', data);
      localStorage.setItem('initialParcelConfig', JSON.stringify({ ...initialParcelConfig, _id: data.data._id }));
      setupInitialConfig();
    })
    .catch(error => {
      console.error('Error al actualizar la configuración inicial:', error);
    });
  }

  updateInitialConfigButton();
}

function updateInitialConfigButton() {
  const initialConfigButton = document.getElementById('initialConfigButton');
  if (localStorage.getItem('initialParcelConfig')) {
    initialConfigButton.textContent = 'Modificar condiciones iniciales';
  } else {
    initialConfigButton.textContent = 'Establecer configuración inicial';
  }
}

function handleIrrigationFormSubmit(event) {
  event.preventDefault();
  const aRoots = parseFloat(document.getElementById("aRoots").value);
  const aDrain = parseFloat(document.getElementById("aDrain").value);
  const bRoots = parseFloat(document.getElementById("bRoots").value);
  const bDrain = parseFloat(document.getElementById("bDrain").value);

  const initialParcelConfig = JSON.parse(localStorage.getItem('initialParcelConfig')) || {};

  const initialDataFromDevices = {
    aRoots: aRoots,
    aDrain: aDrain,
    bRoots: bRoots,
    bDrain: bDrain,
    irrigationStart: `${initialParcelConfig.config.initialDate} ${initialParcelConfig.config.startTime1} `,
    irrigationEnd: moment(`${initialParcelConfig.config.initialDate} ${initialParcelConfig.config.startTime1}`).clone().add(initialParcelConfig.config.baseIrrigation * 60 * 1000, "milliseconds").format("YYYY-MM-DD HH:mm:ss"),
  };

  let parcelConfig = initialParcelConfig;
  let dataFromDevices = initialDataFromDevices;
  let numberOfIrrigations = 1;

  const pendingIrrigations = nextIrrigations.filter(current_irrigation => current_irrigation.isPending);

  if (nextIrrigations.length) {
    const notPendingIrrigations = nextIrrigations.filter(current_irrigation => !current_irrigation.isPending);
    const irrigationStart = notPendingIrrigations[notPendingIrrigations.length - 1].startTime;
    const irrigationEnd = notPendingIrrigations[notPendingIrrigations.length - 1].endTime;
    parcelConfig = notPendingIrrigations[notPendingIrrigations.length - 1];
    dataFromDevices = { ...initialDataFromDevices, irrigationStart, irrigationEnd };

    if (nextIrrigations.length > 1) {
      let index = nextIrrigations.length - 2;
      let different_date = false;
      while (index >= 0 && !different_date) {
        const previous_irrigation = nextIrrigations[index];
        const current_irrigation = nextIrrigations[index + 1];
        if (current_irrigation.startTime.split(' ')[0] !== previous_irrigation.startTime.split(' ')[0]) {
          different_date = true;
        } else {
          numberOfIrrigations++;
          index--;
        }
      }
    }
  }

  if (pendingIrrigations.length > 0) {
    updateIrrigation(parcelConfig, dataFromDevices, pendingIrrigations);
  } else {
    scheduleIrrigation(parcelConfig, dataFromDevices, numberOfIrrigations);
  }
  localStorage.setItem('nextIrrigations', JSON.stringify(nextIrrigations));

  updateBackendIrrigations();
}

function setupInitialIrrigation(initialConfig) {
  const date = `${initialConfig.config.initialDate} ${initialConfig.config.startTime1}`

  const initialIrrigation = {
    id: 0,
    isPending: false,
    parcelName: initialConfig.parcelName || "Sector 2",
    config: initialConfig.config || {},
    startTime: moment(date).format("YYYY-MM-DD HH:mm:ss"),
    endTime: moment(date).add(initialConfig.config.baseIrrigation, 'minutes').format("YYYY-MM-DD HH:mm:ss")
  };

  const savedIrrigations = localStorage.getItem('nextIrrigations');
  nextIrrigations = savedIrrigations ? JSON.parse(savedIrrigations) : [];

  nextIrrigations.push(initialIrrigation);

  localStorage.setItem('nextIrrigations', JSON.stringify(nextIrrigations));

  displayIrrigationsInTable(nextIrrigations);
}

function resetInitialConfig() {
  // Eliminar todos los datos del localStorage
  localStorage.clear();

  // Reiniciar los campos del formulario
  const fieldNames = [
    'rootsL', 'drainL', 'aRootsTimelapse', 'aDrainTimelapse', 'percentageIncrement',
    'rootsLThreshold', 'drainLThreshold', 'baseIrrigation', 'minIrrigationTimeMin',
    'maxIrrigationTimeMin', 'startTime1', 'startTime2', 'startTime3', 'initialDate'
  ];

  fieldNames.forEach(fieldName => {
    document.getElementById(fieldName).value = '';
  });

  const tableBody = document.getElementById('irrigationTableBody');
  tableBody.innerHTML = '';

  console.log("Valores iniciales restablecidos y LocalStorage limpiado.");

  updateInitialConfigButton();
}

//----------------------------------------------------------------------//

//Sensor VALUES 

function calculateNextEndTime() {
  const savedConfigurations = localStorage.getItem('nextIrrigations');

  if (savedConfigurations) {
    const configurations = JSON.parse(savedConfigurations);
    const nonPendingConfigurations = configurations.filter(config => !config.isPending);

    if (nonPendingConfigurations.length > 0) {
      const lastNonPendingConfig = nonPendingConfigurations[nonPendingConfigurations.length - 1];
      const lastEndTime = moment(lastNonPendingConfig.endTime);
      const minutes = lastEndTime.minutes();
      if (minutes >= 0 && minutes < 30) {
        lastEndTime.minutes(30);
      } else {
        lastEndTime.add(1, 'hours').startOf('hour').minutes(0);
      }
      const formattedNextEndTime = lastEndTime.format("YYYY-MM-DD HH:mm:ss");
      return formattedNextEndTime;
    } else {
      alert('No hay configuraciones no pendientes.');
      return null;
    }
  } else {
    alert('No hay configuraciones almacenadas.');
    return null;
  }
}

async function fetchData(authToken, url) {
  document.getElementById("loading").style.display = "block";
  let aRootsTimelapse = 0
  let aDrainTimelapse = 0

  let data = localStorage.getItem('initialParcelConfig')
  if (data) {
    data = JSON.parse(data)
    if (data.config) {
      aRootsTimelapse = parseInt(data.config.aRootsTimelapse)
      aDrainTimelapse = parseInt(data.config.aDrainTimelapse)
    } else {
      console.error('data.config is undefined')
    }
  } else {
    console.error('data is null')
  }

  const fields = getFormDataFromFields(['rootsL', 'drainL'])
  const rootsLevel = fields.rootsL - 1 //Empiezan en 0
  const drainLevel = fields.drainL - 1

  const measureTimeLapse = Math.max(aDrainTimelapse, aRootsTimelapse);
  const nextEndTime = calculateNextEndTime();
  if (!nextEndTime) {
    document.getElementById("loading").style.display = "none";
    alert('No se pudo calcular el próximo end time.');
    return;
  }
  const lastIrrigationTime = moment(nextEndTime).utcOffset(60);
  const startTime = lastIrrigationTime.clone();
  const endTime = startTime.clone().add(measureTimeLapse, 'hour');
  const dateFrom = startTime.toISOString();
  const dateTo = endTime.toISOString();
  const URL = `${url}?dateFrom=${dateFrom}&dateTo=${dateTo}`
  
  try {
    const response = await fetch(URL, {
      headers: {
        'x-access-token': authToken,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data)
      const firstResponse = data.contextResponses[0];
      const lastResponse = data.contextResponses[data.contextResponses.length - 1];

      const firstValues = firstResponse.contextElement.attributes[0].values;
      const firstValue = firstValues[0];
      const firstAttrValue = firstValue.attrValue;

      const lastValues = lastResponse.contextElement.attributes[0].values;
      const lastValue = lastValues[lastValues.length - 1];
      const lastAttrValue = lastValue.attrValue;

      updateFormValues(firstAttrValue[rootsLevel], firstAttrValue[drainLevel], lastAttrValue[rootsLevel], lastAttrValue[drainLevel]);
      document.getElementById("loading").style.display = "none";
    } else {
      console.error('Error al obtener los datos:', response.statusText);
      alert('Error al obtener los datos. Por favor introduzca la información manualmente o vuelva a intentarlo')
    }
  } catch (error) {
    console.error('Error al realizar la solicitud:', error);
    alert('Error al obtener los datos. Por favor introduzca la información manualmente o vuelva a intentarlo')
    document.getElementById("loading").style.display = "none";
  }
}

function updateFormValues(bRootsValue, aRootsValue, bDrainValue, aDrainValue) {
  document.getElementById("bRoots").value = bRootsValue;
  document.getElementById("aRoots").value = aRootsValue;
  document.getElementById("bDrain").value = bDrainValue;
  document.getElementById("aDrain").value = aDrainValue;
}

//Irrigation DSS

function scheduleIrrigation(config, dataFromDevices, previousNumberOfIrrigations) {
  // Calcula el próximo riego
  let nextIrrigation = calculateNextIrrigation({ ...config, config: { ...config.config, baseIrrigation: config.config.baseIrrigation * previousNumberOfIrrigations } }, dataFromDevices);
  const incrementPercentage = nextIrrigation.incrementPercentage / 100;
  const numberOfIrrigations = nextIrrigation.numberOfIrrigations;
  let newBaseIrrigation = calcNewBaseIrrigation(config, config.config.baseIrrigation * previousNumberOfIrrigations, incrementPercentage, numberOfIrrigations);

  let previousStartIrrigation = moment(dataFromDevices.irrigationStart);
  const currentDate = previousStartIrrigation
    .clone()
    .add(dayInMs, "milliseconds")
    .format("YYYY-MM-DD");

  let irrigationRanges = []
  if (numberOfIrrigations === 2) {
    irrigationRanges = [
      moment(currentDate + " " + config.config.startTime1 + ":00"),
      moment(currentDate + " " + config.config.startTime2 + ":00")
    ]
  } else if (numberOfIrrigations === 3) {
    irrigationRanges = [
      moment(currentDate + " 06:00:00"),
      moment(currentDate + " 12:00:00"),
      moment(currentDate + " 18:00:00"),
    ]
  } else if (numberOfIrrigations === 4) {
    irrigationRanges = [
      moment(currentDate + " 06:00:00"),
      moment(currentDate + " 10:00:00"),
      moment(currentDate + " 14:00:00"),
      moment(currentDate + " 18:00:00"),
    ]
  }
  else {
    irrigationRanges = [
      moment(currentDate + " " + config.config.startTime1 + ":00"),
    ]
  }

  for (let i = 0; i < numberOfIrrigations; i++) {
    const last_index = nextIrrigations.length ? nextIrrigations[nextIrrigations.length - 1].id : 0;
    const duration = newBaseIrrigation * 60 * 1000;
    const startTime = moment(irrigationRanges[i])
      .clone()
      .format("YYYY-MM-DD HH:mm:ss");
    const endTime = moment(startTime)
      .clone()
      .add(duration, "milliseconds")
      .format("YYYY-MM-DD HH:mm:ss");

    const newConfig = {
      ...config.config,
      baseIrrigation: newBaseIrrigation,
      percentageIncrement: incrementPercentage * 100
    }
    const irrigation = {
      id: last_index + 1,
      isPending: i !== 0,
      parcelName: config.parcelName,
      config: newConfig,
      startTime,
      endTime,
    }
    nextIrrigations.push(irrigation);
  }

  displayIrrigationsInTable(nextIrrigations);

  // Enviar datos al backend
  updateBackendIrrigations();
}

function updateIrrigation(config, dataFromDevices, pendingIrrigations) {
  let nextIrrigation = calculateNextIrrigation(config, dataFromDevices);
  const incrementPercentage = nextIrrigation.incrementPercentage / 100;
  const numberOfIrrigations = 1;
  let newBaseIrrigation = calcNewBaseIrrigation(config, config.config.baseIrrigation, incrementPercentage, numberOfIrrigations);

  const duration = newBaseIrrigation * 60 * 1000;
  const startTime = moment(pendingIrrigations[0].startTime)
    .clone()
    .format("YYYY-MM-DD HH:mm:ss");
  const endTime = moment(startTime)
    .clone()
    .add(duration, "milliseconds")
    .format("YYYY-MM-DD HH:mm:ss");

  const newConfig = {
    ...config.config,
    baseIrrigation: newBaseIrrigation,
    percentageIncrement: incrementPercentage * 100
  }
  const irrigation = {
    ...pendingIrrigations[0],
    isPending: false,
    parcelName: config.parcelName,
    config: newConfig,
    endTime,
  }

  nextIrrigations[nextIrrigations.length - pendingIrrigations.length] = irrigation;
  displayIrrigationsInTable(nextIrrigations);

  // Enviar datos al backend
  updateBackendIrrigations();
}

const calcNewBaseIrrigation = (config, baseIrrigation, increment, numberOfIrrigations) => {
  let newBaseIrrigation = Math.round((baseIrrigation * (increment > 0 ? 1 + increment : 1 + increment)) / numberOfIrrigations);

  if (newBaseIrrigation < config.config.minIrrigationTimeMin) {
    newBaseIrrigation = config.config.minIrrigationTimeMin;
  }
  if (newBaseIrrigation > config.config.maxIrrigationTimeMin) {
    newBaseIrrigation = config.config.maxIrrigationTimeMin;
  }
  return newBaseIrrigation
}

function calculateNextIrrigation(p_config, p_dataRetrieved) {
  let internalResponseDataset = {
    incrementPercentage: NaN,
    totalTime: NaN,
    numberOfIrrigations: NaN,
  };

  if (
    p_dataRetrieved.aRoots == -1 ||
    p_dataRetrieved.bRoots == -1 ||
    p_dataRetrieved.aDrain == -1 ||
    p_dataRetrieved.bDrain == -1
  ) {
    internalResponseDataset.incrementPercentage = 0;
    internalResponseDataset.totalTime = p_config.config.baseIrrigation;
    internalResponseDataset.numberOfIrrigations = 0;
  } else {
    let irrigationTime =
      Math.abs(
        new Date(p_dataRetrieved.irrigationStart).getTime() -
        new Date(p_dataRetrieved.irrigationEnd).getTime(),
      ) / 60000;
    if (
      p_dataRetrieved.aDrain - p_dataRetrieved.bDrain >=
      p_config.config.drainLThreshold
    ) {
      internalResponseDataset.incrementPercentage = -15;
      internalResponseDataset.totalTime =
        irrigationTime -
        (irrigationTime * p_config.config.percentageIncrement) / 100;
      internalResponseDataset.numberOfIrrigations = calculateNumberOfIrrigation(internalResponseDataset, p_config);
    } else {
      if (
        p_dataRetrieved.aRoots - p_dataRetrieved.bRoots <=
        p_config.config.rootsLThreshold
      ) {
        internalResponseDataset.incrementPercentage = 15;
        internalResponseDataset.totalTime =
          irrigationTime +
          (irrigationTime * p_config.config.percentageIncrement) / 100;
        internalResponseDataset.numberOfIrrigations =
          calculateNumberOfIrrigation(internalResponseDataset, p_config);
      } else {
        internalResponseDataset.incrementPercentage = 0;
        internalResponseDataset.totalTime = irrigationTime;
        internalResponseDataset.numberOfIrrigations =
          calculateNumberOfIrrigation(internalResponseDataset, p_config);
      }
    }
    if (
      internalResponseDataset.totalTime < p_config.config.minIrrigationTimeMin
    )
      internalResponseDataset.totalTime = p_config.config.minIrrigationTimeMin;
  }
  return internalResponseDataset;
}

function calculateNumberOfIrrigation(internalResponseDataset, p_config) {
  let nIrrigations = 1;
  const baseIrrigation = p_config.config.baseIrrigation;
  const incrementPercentage = internalResponseDataset.incrementPercentage / 100;

  const nextIrrigationValue = baseIrrigation * (incrementPercentage >= 0 ? 1 + incrementPercentage : 1 + incrementPercentage)
  let tempIrrigationValue = nextIrrigationValue;
  while (tempIrrigationValue > p_config.config.maxIrrigationTimeMin) {
    nIrrigations++;
    tempIrrigationValue = nextIrrigationValue / nIrrigations;
  }
  while (tempIrrigationValue < p_config.config.minIrrigationTimeMin) {
    nIrrigations--;
    tempIrrigationValue = nextIrrigationValue / nIrrigations;
  }
  return nIrrigations;
}

function getIrrigationsList() {
  fetch(`${apiUrl}/irrigation`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': authToken
    }
  })
  .then(response => response.json())
  .then(data => {
    nextIrrigations = data.data || [];
    displayIrrigationsInTable(nextIrrigations);
  })
  .catch(error => {
    console.error('Error al obtener las irrigaciones:', error);
  });
}

function displayIrrigationsInTable(irrigations) {
  const tableBody = document.getElementById('irrigationTableBody'); // Suponiendo que tu tabla tiene un tbody con el id "irrigationTableBody"
  tableBody.innerHTML = '';

  // Iterar sobre los datos y crear filas de tabla
  irrigations.forEach(irrigation => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${irrigation.config.baseIrrigation}</td>
      <td>${irrigation.startTime}</td>
      <td>${irrigation.endTime}</td>
      <td>
        <button class="edit-btn" data-id="${irrigation._id}">Editar</button>
        <button class="delete-btn" data-id="${irrigation._id}">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Agregar eventos para los botones de edición y eliminación
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', handleEditIrrigation);
  });
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', handleDeleteIrrigation);
  });
}

function handleEditIrrigation(event) {
  const id = event.target.dataset.id;
  const irrigation = nextIrrigations.find(irrigation => irrigation._id === id);
  if (irrigation) {
    const newBaseIrrigation = prompt("Nueva base de riego (min):", irrigation.config.baseIrrigation);
    if (newBaseIrrigation !== null) {
      irrigation.config.baseIrrigation = parseInt(newBaseIrrigation);
      updateIrrigationInBackend(irrigation);
    }
  }
}

function handleDeleteIrrigation(event) {
  const id = event.target.dataset.id;
  deleteIrrigationFromBackend(id);
}

function updateIrrigationInBackend(irrigation) {
  fetch(`${apiUrl}/irrigation/${irrigation._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': authToken
    },
    body: JSON.stringify({ irrigation, configId: irrigation.config._id })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Irrigación actualizada:', data);
    getIrrigationsList(); // Recargar la lista de irrigaciones
  })
  .catch(error => {
    console.error('Error al actualizar la irrigación:', error);
  });
}

function deleteIrrigationFromBackend(id) {
  fetch(`${apiUrl}/irrigation/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': authToken
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Irrigación eliminada:', data);
    getIrrigationsList(); // Recargar la lista de irrigaciones
  })
  .catch(error => {
    console.error('Error al eliminar la irrigación:', error);
  });
}

function updateBackendIrrigations() {
  fetch(`${apiUrl}/irrigation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': authToken
    },
    body: JSON.stringify(nextIrrigations)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Irrigaciones actualizadas en el backend:', data);
  })
  .catch(error => {
    console.error('Error al actualizar las irrigaciones en el backend:', error);
  });
}
