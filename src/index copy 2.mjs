const moment = require("moment");
let nextIrrigations = [];
/*const initialParcelConfig = {
  parcelName: "Parcela de Ejemplo",
  configFilled: false,
  config: {
    rootsL: 4,
    drainL: 6,
    aRootsTimelapse: 2,
    aDrainTimelapse: 3,
    percentageIncrement: 15,
    rootsLThreshold: 0.5,  // Umbral de diferencia entre agua absorbida y drenada para determinar múltiples riegos
    drainLThreshold: 0.3,
    baseIrrigation: 70,
    minIrrigationTimeMin: 60, //min
    maxIrrigationTimeMin: 120, //max
    devices: {
      rootsLController: "controller1",
      rootsLId: "sensor40",
      drainLController: "controller2",
      drainLId: "sensor60",
      waterValveController: "valve1",
      waterValveId: "valve1",
    },
  },
};*/

let initialParcelConfig = JSON.parse(localStorage.getItem('initialParcelConfig')) || {};

// Llenar los campos del formulario con los valores almacenados
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
document.getElementById('startTime1').value = initialParcelConfig.startTime1 || '';
document.getElementById('startTime2').value = initialParcelConfig.startTime2 || '';

// Event listener para capturar el envío del formulario
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
      startTime2: document.getElementById('startTime2').value
    },

  };
  // Guardar initialParcelConfig en localStorage
  localStorage.setItem('initialParcelConfig', JSON.stringify(initialParcelConfig));

  // Aquí puedes hacer lo que necesites con el objeto initialParcelConfig, como enviarlo al backend o usarlo localmente.
  console.log("Initial Parcel Config:", initialParcelConfig);
});

document
  .getElementById("irrigationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const aRoots = parseInt(document.getElementById("aRoots").value);
    const aDrain = parseInt(document.getElementById("aDrain").value);
    const bRoots = parseInt(document.getElementById("bRoots").value);
    const bDrain = parseInt(document.getElementById("bDrain").value);

    
    const initialDataFromDevices = {
      aRoots: aRoots,   // Cantidad de agua absorbida por las raíces
      aDrain: aDrain,    // Cantidad de agua drenada
      bRoots: bRoots,    // Otro parámetro de agua absorbida por las raíces
      bDrain: bDrain,   // Otro parámetro de agua drenada
      irrigationStart: "2024-04-21 09:00:00",
      irrigationEnd: "2024-04-21 10:00:00",
    };

    let parcelConfig = initialParcelConfig;
    let dataFromDevices = initialDataFromDevices;
    console.log('parrrrcel', parcelConfig)
    if(nextIrrigations.length){
      const irrigationStart = nextIrrigations[nextIrrigations.length - 1].startTime
      const irrigationEnd = nextIrrigations[nextIrrigations.length - 1].endTime
      parcelConfig = nextIrrigations[nextIrrigations.length - 1];
      dataFromDevices = { ...initialDataFromDevices, irrigationStart, irrigationEnd }
    }
    scheduleIrrigation(parcelConfig, dataFromDevices, parseInt(localStorage.getItem('onePreviousIrrigation')));
    localStorage.setItem('nextIrrigations', JSON.stringify(nextIrrigations));
  });

window.addEventListener('load', function () {

  localStorage.setItem('onePreviousIrrigation', '1')
  const savedIrrigations = localStorage.getItem('nextIrrigations');
  if (savedIrrigations) {
    nextIrrigations = JSON.parse(savedIrrigations);
    // Haz algo con nextIrrigations, como mostrarlos en la consola
    console.log('Próximos riegos cargados:', nextIrrigations);
  } else {
    nextIrrigations = [];
    console.log('No hay próximos riegos guardados.');
  }
});

function scheduleIrrigation(config, dataFromDevices, onePreviousIrrigation) {

  const calcNewBaseIrrigation = (baseIrrigation, increment, numberOfIrrigations) => {
    let newBaseIrrigation = Math.round((baseIrrigation * (1 + increment)) / numberOfIrrigations);

    if (newBaseIrrigation < config.config.minIrrigationTimeMin) {
      newBaseIrrigation = config.config.minIrrigationTimeMin;
    }
    return newBaseIrrigation
  }
  
  // Calcula el próximo riego
  let nextIrrigation = calculateNextIrrigation(config, dataFromDevices);

  // Determina cuántos riegos programar y distribuye uniformemente si es necesario
  const incrementPercentage = nextIrrigation.incrementPercentage / 100;
  const numberOfIrrigations = nextIrrigation.numberOfIrrigations;
  let newBaseIrrigation = calcNewBaseIrrigation(!onePreviousIrrigation ? config.config.baseIrrigation*2 : config.config.baseIrrigation, incrementPercentage, numberOfIrrigations);
  console.log('onePreviousIrrigation', onePreviousIrrigation)
  console.log('baseIrrigation', config.config.baseIrrigation)
  console.log('Max: ', config.config.maxIrrigationTimeMin)
  console.log('Min: ', config.config.minIrrigationTimeMin)
  console.log('numberOfIrrigations: ', numberOfIrrigations)
  console.log('newBaseIrrigation: ', newBaseIrrigation)
  console.log('date', config.startTime1)

  const dayInMs =  (24 * 60 * 60 * 1000)
  let previousStartIrrigation = moment(dataFromDevices.irrigationStart);
  const currentDate = previousStartIrrigation
    .clone()
      .add(dayInMs, "milliseconds")
        .format("YYYY-MM-DD");

  let irrigationRanges = []
  if (numberOfIrrigations === 2) {
    irrigationRanges = [
      //moment(currentDate + " 06:00:00"),
      //moment(currentDate + " 15:00:00"),
      moment(currentDate + " " + config.startTime1 + ":00"),
      moment(currentDate + " " + config.startTime2 + ":00")
    ]
  } else if (numberOfIrrigations === 3) {
    irrigationRanges = [
      moment(currentDate + " 06:00:00"),
      moment(currentDate + " 12:00:00"),
      moment(currentDate + " 18:00:00"),
    ]
  }else if (numberOfIrrigations === 4) {
    irrigationRanges = [
      moment(currentDate + " 06:00:00"),
      moment(currentDate + " 10:00:00"),
      moment(currentDate + " 14:00:00"),
      moment(currentDate + " 18:00:00"),
    ]
  }
  else {
    irrigationRanges = [
      moment(currentDate + " " + config.startTime1)
    ]
  }

  let nextIrrigationValue = newBaseIrrigation;
  for (let i = 0; i < numberOfIrrigations; i++) {
    const last_index = nextIrrigations.length ? nextIrrigations[nextIrrigations.length - 1].id : 0;
    const duration = nextIrrigationValue * 60 * 1000;
    const startTime = moment(irrigationRanges[i])
      .clone()
      .format("YYYY-MM-DD HH:mm:ss");
    const endTime = moment(startTime)
      .clone()
      .add(duration, "milliseconds")
      .format("YYYY-MM-DD HH:mm:ss");
    if (i === 1){
      const previous_config = nextIrrigations[nextIrrigations.length - 1];
      let nextIrrigation = calculateNextIrrigation(previous_config, dataFromDevices);
      nextIrrigationValue = calcNewBaseIrrigation(newBaseIrrigation, (nextIrrigation.incrementPercentage / 100), 1);
    }

    const newConfig = {
      ...config.config,
      baseIrrigation: nextIrrigationValue,
      percentageIncrement: incrementPercentage * 100
    }
    const irrigation = {
      id: last_index + 1 ,
      parcelName: config.parcelName,
      config: newConfig,
      startTime,
      endTime
    }
    nextIrrigations.push(irrigation);
  }

  if(numberOfIrrigations > 1 ){
    localStorage.setItem('onePreviousIrrigation', '0')
  } else {
    localStorage.setItem('onePreviousIrrigation', '1')
  }

  displayIrrigationsInTable(nextIrrigations);
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
      internalResponseDataset.incrementPercentage = 0;
      internalResponseDataset.totalTime = 0;
      internalResponseDataset.numberOfIrrigations = 0;
    } else {
      if (
        p_dataRetrieved.aRoots - p_dataRetrieved.bRoots <=
        p_config.config.rootsLThreshold
      ) {
        internalResponseDataset.incrementPercentage =
          p_config.config.percentageIncrement;
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
  const incrementPercentage = internalResponseDataset.incrementPercentage/100;

  const nextIrrigationValue = baseIrrigation * (1 + incrementPercentage)
  if (nextIrrigationValue > p_config.config.maxIrrigationTimeMin) {
    nIrrigations++;
  } else if (nextIrrigationValue < p_config.config.minIrrigationTimeMin) {
    nIrrigations--;
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
