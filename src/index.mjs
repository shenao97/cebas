const moment = require("moment");
let nextIrrigations = [];
const dayInMs = (24 * 60 * 60 * 1000)

let initialParcelConfig = JSON.parse(localStorage.getItem('initialParcelConfig')) || {};

document.getElementById('rootsL').value = initialParcelConfig.config && initialParcelConfig.config.rootsL || '';
document.getElementById('drainL').value = initialParcelConfig.config && initialParcelConfig.config.drainL || '';
document.getElementById('aRootsTimelapse').value = initialParcelConfig.config && initialParcelConfig.config.aRootsTimelapse || '';
document.getElementById('aDrainTimelapse').value = initialParcelConfig.config && initialParcelConfig.config.aDrainTimelapse || '';
document.getElementById('percentageIncrement').value = initialParcelConfig.config && initialParcelConfig.config.percentageIncrement || '';
document.getElementById('rootsLThreshold').value = initialParcelConfig.config && initialParcelConfig.config.rootsLThreshold || '';
document.getElementById('drainLThreshold').value = initialParcelConfig.config && initialParcelConfig.config.drainLThreshold || '';
document.getElementById('baseIrrigation').value = initialParcelConfig.config && initialParcelConfig.config.baseIrrigation || '';
document.getElementById('minIrrigationTimeMin').value = initialParcelConfig.config && initialParcelConfig.config.minIrrigationTimeMin || '';
document.getElementById('maxIrrigationTimeMin').value = initialParcelConfig.config && initialParcelConfig.config.maxIrrigationTimeMin || '';
document.getElementById('startTime1').value = initialParcelConfig.config && initialParcelConfig.config.startTime1 || '09:00';
document.getElementById('startTime2').value = initialParcelConfig.config && initialParcelConfig.config.startTime2 || '15:00';
document.getElementById('startTime3').value = initialParcelConfig.config && initialParcelConfig.config.startTime3 || '18:00';
document.getElementById('initialDate').value = initialParcelConfig.config && initialParcelConfig.config.initialDate || '2024-04-20';


document.getElementById("parcelConfigForm").addEventListener("submit", function(event) {
  event.preventDefault();
  // Construir el objeto initialParcelConfig
  initialParcelConfig = {
    parcelName: 'test',
    configFilled: false,
    config: {
      rootsL: parseInt(document.getElementById("rootsL").value),
      drainL: parseInt(document.getElementById("drainL").value),
      aRootsTimelapse: parseInt(document.getElementById("aRootsTimelapse").value),
      aDrainTimelapse: parseInt(document.getElementById("aDrainTimelapse").value),
      percentageIncrement: parseInt(document.getElementById("percentageIncrement").value),
      rootsLThreshold: parseFloat(document.getElementById("rootsLThreshold").value),
      drainLThreshold: parseFloat(document.getElementById("drainLThreshold").value),
      baseIrrigation: parseInt(document.getElementById("baseIrrigation").value),
      minIrrigationTimeMin: parseInt(document.getElementById("minIrrigationTimeMin").value),
      maxIrrigationTimeMin: parseInt(document.getElementById("maxIrrigationTimeMin").value),
      devices: {
        rootsLController: "controller1",
        rootsLId: "sensor40",
        drainLController: "controller2",
        drainLId: "sensor60",
        waterValveController: "valve1",
        waterValveId: "valve1"
      },
      startTime1: document.getElementById('startTime1').value,
      startTime2: document.getElementById('startTime2').value,
      startTime3: document.getElementById('startTime3').value,
      initialDate: document.getElementById('initialDate').value,

    },
  };
  if (!localStorage.getItem('initialParcelConfig')) {
    localStorage.setItem('initialParcelConfig', JSON.stringify(initialParcelConfig));
    //setupInitialIrrigation(initialParcelConfig);
    console.log("Initial Parcel Config:", initialParcelConfig);
  }
});


/*function setupInitialIrrigation(initialConfig) {
  const initialIrrigation = {
    id: 0,
    isPending: false, // No es necesario programar el riego inicial
    parcelName: initialConfig.parcelName || "Parcela de Ejemplo",
    config: initialConfig.config || {}, // Utiliza la configuración inicial
    startTime: moment().format("YYYY-MM-DD HH:mm:ss"), // Inicia en el momento actual
    endTime: moment().add(initialConfig.config.baseIrrigation, 'minutes').format("YYYY-MM-DD HH:mm:ss") // Termina después de la duración del riego inicial
  };
  
  // Obtener los próximos riegos del localStorage
  const savedIrrigations = localStorage.getItem('nextIrrigations');
  let nextIrrigations = [];
  if (savedIrrigations) {
    nextIrrigations = JSON.parse(savedIrrigations);
  }
  
  // Agregar el riego inicial a la lista de próximos riegos
  nextIrrigations.push(initialIrrigation);
  
  // Guardar la lista actualizada de próximos riegos en el localStorage
  localStorage.setItem('nextIrrigations', JSON.stringify(nextIrrigations));
}*/

document.getElementById("irrigationForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const aRoots = parseInt(document.getElementById("aRoots").value);
    const aDrain = parseInt(document.getElementById("aDrain").value);
    const bRoots = parseInt(document.getElementById("bRoots").value);
    const bDrain = parseInt(document.getElementById("bDrain").value);

    const initialParcelConfig = {
      parcelName: "Parcela de Ejemplo",
      configFilled: false,
      isPending: false,
      config: {
        rootsL: parseInt(document.getElementById("rootsL").value),
        drainL: parseInt(document.getElementById("drainL").value),
        aRootsTimelapse: parseInt(document.getElementById("aRootsTimelapse").value),
        aDrainTimelapse: parseInt(document.getElementById("aDrainTimelapse").value),
        percentageIncrement: parseInt(document.getElementById("percentageIncrement").value),
        rootsLThreshold: parseFloat(document.getElementById("rootsLThreshold").value),
        drainLThreshold: parseFloat(document.getElementById("drainLThreshold").value),
        baseIrrigation: parseInt(document.getElementById("baseIrrigation").value),
        minIrrigationTimeMin: parseInt(document.getElementById("minIrrigationTimeMin").value),
        maxIrrigationTimeMin: parseInt(document.getElementById("maxIrrigationTimeMin").value),
        devices: {
          rootsLController: "controller1",
          rootsLId: "sensor40",
          drainLController: "controller2",
          drainLId: "sensor60",
          waterValveController: "valve1",
          waterValveId: "valve1",
        },
        startTime1: document.getElementById("startTime1").value,
        startTime2: document.getElementById("startTime2").value,
        startTime3: document.getElementById('startTime3').value,
        initialDate: document.getElementById('initialDate').value,
      },
    };

    const initialDataFromDevices = {
      aRoots: aRoots,   // Cantidad de agua absorbida por las raíces
      aDrain: aDrain,    // Cantidad de agua drenada
      bRoots: bRoots,    // Otro parámetro de agua absorbida por las raíces
      bDrain: bDrain,   // Otro parámetro de agua drenada
      irrigationStart: `${initialParcelConfig.config.initialDate} ${initialParcelConfig.config.startTime1} `,
      irrigationEnd: moment(`${initialParcelConfig.config.initialDate} ${initialParcelConfig.config.startTime1}`).clone().add(baseIrrigation*60*1000, "milliseconds").format("YYYY-MM-DD HH:mm:ss"),
    };


    let parcelConfig = initialParcelConfig;
    let dataFromDevices = initialDataFromDevices;
    let numberOfIrrigations = 1;

    const pendingIrrigations = nextIrrigations.filter(current_irrigation => current_irrigation.isPending)

    if (nextIrrigations.length) {
      const notPendingIrrigations = nextIrrigations.filter(current_irrigation => !current_irrigation.isPending)
      const irrigationStart = notPendingIrrigations[notPendingIrrigations.length - 1].startTime
      const irrigationEnd = notPendingIrrigations[notPendingIrrigations.length - 1].endTime
      parcelConfig = notPendingIrrigations[notPendingIrrigations.length - 1];
      dataFromDevices = { ...initialDataFromDevices, irrigationStart, irrigationEnd }

      if (nextIrrigations.length > 1) {
        let index = nextIrrigations.length - 2;
        let different_date = false;
        while (index >= 0 && !different_date) {
          const previous_irrigation = nextIrrigations[index]
          const current_irrigation = nextIrrigations[index + 1]
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
    //const nextEndTime = calculateNextEndTime();
    //console.log('Próximo end time aproximado:', nextEndTime);

  });

/*window.addEventListener('load', function () {
  const savedIrrigations = localStorage.getItem('nextIrrigations');
  if (savedIrrigations) {
    nextIrrigations = JSON.parse(savedIrrigations);
    console.log('Próximos riegos cargados:', nextIrrigations);
  } else {
    nextIrrigations = [];
    console.log('No hay próximos riegos guardados.');
  }
});*/

//CONSULTAR INFORMACIÓN DE SENSORES


function calculateNextEndTime() {
  const savedConfigurations = localStorage.getItem('nextIrrigations');
  
  if (savedConfigurations) {
    const configurations = JSON.parse(savedConfigurations);
    const nonPendingConfigurations = configurations.filter(config => !config.isPending);
    
    if (nonPendingConfigurations.length > 0) {
      const lastNonPendingConfig = nonPendingConfigurations[nonPendingConfigurations.length - 1];
      const lastEndTime = moment(lastNonPendingConfig.endTime);
      const aDrainTimelapse = lastNonPendingConfig.config.aDrainTimelapse || 0;
      let nextEndTime = lastEndTime.add(aDrainTimelapse, 'hours');
      const minutes = nextEndTime.minutes();
      if (minutes >= 0 && minutes < 30) {
        nextEndTime.minutes(30);
      } else {
        nextEndTime.add(1, 'hours').startOf('hour').minutes(0);
      }
      const formattedNextEndTime = nextEndTime.format("YYYY-MM-DD HH:mm:ss");
      return formattedNextEndTime;
    } else {
      console.log('No hay configuraciones no pendientes.');
      return null;
    }
  } else {
    console.log('No hay configuraciones almacenadas en el localStorage.');
    return null;
  }
}

async function fetchData(authToken) {
  // Calcular la hora para dateFrom y dateTo
  const nextEndTime = calculateNextEndTime();
  if (!nextEndTime) {
    console.log('No se pudo calcular el próximo end time.');
    return;
  }

// Sumar una hora al endTime
// Convertir el endTime a un objeto Moment y ajustarlo a la zona horaria UTC-2
const endTime = moment(nextEndTime).utcOffset(-120);

// Calcular el startTime restando una hora al endTime
const startTime = endTime.clone().subtract(2,'hour');

// Calcular el endTime ajustando una hora más al endTime original
const adjustedEndTime = startTime.clone().add(2, 'hour');

// Convertir startTime y adjustedEndTime a cadenas en formato ISO
const dateFrom = startTime.toISOString();
const dateTo = adjustedEndTime.toISOString();

// Mostrar los resultados
console.log('dateFrom:', dateFrom);
console.log('dateTo:', dateTo);
  // Construir la URL del endpoint con las fechas calculadas
  const url = `https://precimed.odins.es/backend/STH/v1/contextEntities/type/Device/id/IPex12:00052/attributes/sdi12_5f1abe29f7d565578dd3e030_Humidity?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  console.log(url)
  try {
    // Realizar la solicitud HTTP utilizando fetch
    const response = await fetch(url, {
      headers: {
        'x-access-token': authToken,
      },
    });

    if (response.ok) {
      // Convertir la respuesta a JSON
      const data = await response.json();
      console.log('Datos obtenidos:', data);

      // Obtener el primer y último elemento del arreglo contextResponses
      const firstResponse = data.contextResponses[0];
      const lastResponse = data.contextResponses[data.contextResponses.length - 1];

      // Obtener recvTime y attrValue del primer elemento de values
      const firstValues = firstResponse.contextElement.attributes[0].values;
      const firstValue = firstValues[0];
      const firstRecvTime = firstValue.recvTime;
      const firstAttrValue = firstValue.attrValue;

      console.log('recvTime del primer valor:', firstRecvTime);
      console.log('attrValue del primer valor:', firstAttrValue);

      // Obtener recvTime y attrValue del último elemento de values
      const lastValues = lastResponse.contextElement.attributes[0].values;
      const lastValue = lastValues[lastValues.length - 1];
      const lastRecvTime = lastValue.recvTime;
      const lastAttrValue = lastValue.attrValue;

      console.log('recvTime del último valor:', lastRecvTime);
      console.log('attrValue del último valor:', lastAttrValue);
      updateFormValues(firstAttrValue[3], firstAttrValue[firstAttrValue.length - 1], lastAttrValue[3], lastAttrValue[lastAttrValue.length - 1]);
    } else {
      console.error('Error al obtener los datos:', response.statusText);
    }
  } catch (error) {
    console.error('Error al realizar la solicitud:', error);
  }
}

document.getElementById("consultSensorsButton").addEventListener("click", async () => {
  const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YzYxZGM0OTgwYmYyNTlkYzJjYjY5ZSIsImFwaVRva2VuIjp0cnVlLCJpYXQiOjE3MTQ5ODU3ODF9.E5xnUyIQpegirek-0J1DdOigIhJ3Zaqaun4l1JROs8g';
  await fetchData(authToken); // Llamar a la función fetchData con el token de autenticación
});

function updateFormValues(bRootsValue, aRootsValue, bDrainValue, aDrainValue) {
  document.getElementById("bRoots").value = bRootsValue;
  document.getElementById("aRoots").value = aRootsValue;
  document.getElementById("bDrain").value = bDrainValue;
  document.getElementById("aDrain").value = aDrainValue;
}

function updateFormValues(bRootsValue, aRootsValue, bDrainValue, aDrainValue) {
  document.getElementById("bRoots").value = bRootsValue;
  document.getElementById("aRoots").value = aRootsValue;
  document.getElementById("bDrain").value = bDrainValue;
  document.getElementById("aDrain").value = aDrainValue;
}


//CALENDARIO DE RIEGO

function scheduleIrrigation(config, dataFromDevices, previousNumberOfIrrigations) {
  // Calcula el próximo riego
  let nextIrrigation = calculateNextIrrigation({ ...config, config: { ...config.config, baseIrrigation: config.config.baseIrrigation * previousNumberOfIrrigations } }, dataFromDevices);
  const incrementPercentage = nextIrrigation.incrementPercentage / 100;
  const numberOfIrrigations = nextIrrigation.numberOfIrrigations;
  let newBaseIrrigation = calcNewBaseIrrigation(config, config.config.baseIrrigation * previousNumberOfIrrigations, incrementPercentage, numberOfIrrigations);
  console.log('previousNumberOfIrrigations', previousNumberOfIrrigations)
  console.log('baseIrrigation', config.config.baseIrrigation * previousNumberOfIrrigations)
  console.log('numberOfIrrigations: ', numberOfIrrigations)
  console.log('newBaseIrrigation: ', newBaseIrrigation)

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
      //moment(currentDate + " 06:00:00"),
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
}

function updateIrrigation(config, dataFromDevices, pendingIrrigations) {

  let nextIrrigation = calculateNextIrrigation(config, dataFromDevices);
  const incrementPercentage = nextIrrigation.incrementPercentage / 100;
  const numberOfIrrigations = 1;
  let newBaseIrrigation = calcNewBaseIrrigation(config, config.config.baseIrrigation, incrementPercentage, numberOfIrrigations);
  console.log('baseIrrigation', config.config.baseIrrigation)
  console.log('numberOfIrrigations: ', numberOfIrrigations)
  console.log('newBaseIrrigation: ', newBaseIrrigation)

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

  console.log(`extIrrigations[${nextIrrigations.length - pendingIrrigations.length}]`, nextIrrigations[nextIrrigations.length - pendingIrrigations.length])
  console.log(`enw irrigation`, irrigation)
  nextIrrigations[nextIrrigations.length - pendingIrrigations.length] = irrigation;
  displayIrrigationsInTable(nextIrrigations);
}

const calcNewBaseIrrigation = (config, baseIrrigation, increment, numberOfIrrigations) => {
  console.log('increment', increment)
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
          (irrigationTime * p_config.config.percentageIncrement) / 100 ;
      console.log(`(${irrigationTime} * ${p_config.config.percentageIncrement}) / 100`, (irrigationTime * p_config.config.percentageIncrement) / 100)
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
  console.log(internalResponseDataset)
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




window.addEventListener('load', function () {
  // Obtener los datos del localStorage
  const savedIrrigations = localStorage.getItem('nextIrrigations');
  if (savedIrrigations) {
    nextIrrigations = JSON.parse(savedIrrigations);
    // Llamar a la función para mostrar los datos en la tabla
    displayIrrigationsInTable(nextIrrigations);
  } else {
    nextIrrigations = [];
  }
});

// Función para mostrar los datos en la tabla HTML
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
    `;
    tableBody.appendChild(row);
  });
}