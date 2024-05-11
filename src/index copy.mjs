const moment = require("moment");
let nextIrrigations = [];

document
  .getElementById("irrigationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Evitar el envío del formulario

    // Obtener los valores del formulario
    /*const parcelName = document.getElementById("parcelName").value;
    const rootsL = parseInt(document.getElementById("rootsL").value);
    const drainL = parseInt(document.getElementById("drainL").value);
    const aRootsTimelapse = parseInt(
      document.getElementById("aRootsTimelapse").value,
    );
    const aDrainTimelapse = parseInt(
      document.getElementById("aDrainTimelapse").value,
    );
    const percentageIncrement = parseInt(
      document.getElementById("percentageIncrement").value,
    );
    const rootsLThreshold = parseFloat(
      document.getElementById("rootsLThreshold").value,
    );
    const drainLThreshold = parseFloat(
      document.getElementById("drainLThreshold").value,
    );
    const baseIrrigation = parseInt(
      document.getElementById("baseIrrigation").value,
    );
    const minIrrigationTimeMin = parseInt(
      document.getElementById("minIrrigationTimeMin").value,
    );
    const maxIrrigationTimeMin = parseInt(
      document.getElementById("maxIrrigationTimeMin").value,
    );
    const aRoots = parseInt(document.getElementById("aRoots").value);
    const aDrain = parseInt(document.getElementById("aDrain").value);
    const bRoots = parseInt(document.getElementById("bRoots").value);
    const bDrain = parseInt(document.getElementById("bDrain").value);
    const irrigationStart = document.getElementById("irrigationStart").value;
    const irrigationEnd = document.getElementById("irrigationEnd").value;

    // Crear el objeto palcelConfig
    const palcelConfig = {
      parcelName: parcelName,
      configFilled: false,
      config: {
        rootsL: rootsL,
        drainL: drainL,
        aRootsTimelapse: aRootsTimelapse,
        aDrainTimelapse: aDrainTimelapse,
        percentageIncrement: percentageIncrement,
        rootsLThreshold: rootsLThreshold,
        drainLThreshold: drainLThreshold,
        baseIrrigation: baseIrrigation,
        minIrrigationTimeMin: minIrrigationTimeMin,
        maxIrrigationTimeMin: maxIrrigationTimeMin,
        devices: {
          rootsLController: "controller1",
          rootsLId: "sensor40",
          drainLController: "controller2",
          drainLId: "sensor60",
          waterValveController: "valve1",
          waterValveId: "valve1",
        },
      },
    };

    // Crear el objeto dataFromDevices
    const dataFromDevices = {
      aRoots: aRoots,
      aDrain: aDrain,
      bRoots: bRoots,
      bDrain: bDrain,
      irrigationStart: irrigationStart,
      irrigationEnd: irrigationEnd,
    };*/


    //dos riegos
    const initialDataFromDevices = {
      aRoots: 10,    // Cantidad de agua absorbida por las raíces
      aDrain: 9,     // Cantidad de agua drenada
      bRoots: 11,    // Otro parámetro de agua absorbida por las raíces
      bDrain: 10,    // Otro parámetro de agua drenada
      irrigationStart: "2024-04-21 09:00:00",
      irrigationEnd: "2024-04-21 10:00:00",
    };

    const initialParcelConfig = {
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
    };

    let parcelConfig = initialParcelConfig;
    let dataFromDevices = initialDataFromDevices;

    if(nextIrrigations.length){
      const irrigationStart = nextIrrigations[nextIrrigations.length - 1].startTime
      const irrigationEnd = nextIrrigations[nextIrrigations.length - 1].endTime
      parcelConfig = nextIrrigations[nextIrrigations.length - 1];
      dataFromDevices = { ...initialDataFromDevices, irrigationStart, irrigationEnd }
    }

    // Llamar a la función para programar el próximo riego
    scheduleIrrigation(parcelConfig, dataFromDevices, parseInt(localStorage.getItem('onePreviousIrrigation')));
    // Imprimir los datos de los próximos riegos
    console.log('nextIrrigations', nextIrrigations);

    localStorage.setItem('nextIrrigations', JSON.stringify(nextIrrigations));
  });

/*const palcelConfig = {
  parcelName: "test",
  configFilled: false,
  config: {
    rootsL: 4,
    drainL: 6,
    aRootsTimelapse: 2,
    aDrainTimelapse: 3,
    percentageIncrement: 15,
    rootsLThreshold: 0,
    drainLThreshold: 0.3,
    baseIrrigation: 60,
    minIrrigationTimeMin: 60,
    maxIrrigationTimeMin: 150,
    devices: {
      rootsLController: "controller1",
      rootsLId: "sensor40",
      drainLController: "controller2",
      drainLId: "sensor60",
      waterValveController: "valve1",
      waterValveId: "valve1",
    },
  },
};

const dataFromDevices = {
  aRoots: 10,
  aDrain: 9,
  bRoots: 11,
  bDrain: 10,
  irrigationStart: "2024-04-21 09:00:00",
  irrigationEnd: "2024-04-21 10:00:00",
};*/

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
    let newBaseIrrigation = (baseIrrigation * (1 + increment)) / numberOfIrrigations;
    console.log(`(${baseIrrigation} * ${(1 + increment)}) / ${numberOfIrrigations} = ${newBaseIrrigation}`)

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
  console.log('onePreviousIrrigation', onePreviousIrrigation)
  let newBaseIrrigation = calcNewBaseIrrigation(!onePreviousIrrigation ? config.config.baseIrrigation*2 : config.config.baseIrrigation, incrementPercentage, numberOfIrrigations);

  console.log('baseIrrigation', config.config.baseIrrigation)
  console.log('Max: ', config.config.maxIrrigationTimeMin)
  console.log('Min: ', config.config.minIrrigationTimeMin)
  console.log('numberOfIrrigations: ', numberOfIrrigations)
  console.log('newBaseIrrigation: ', newBaseIrrigation)

  const dayInMs =  (24 * 60 * 60 * 1000)
  let previousStartIrrigation = moment(dataFromDevices.irrigationStart);
  const currentDate = previousStartIrrigation
    .clone()
      .add(dayInMs, "milliseconds")
        .format("YYYY-MM-DD");

  let irrigationRanges = []
  if (numberOfIrrigations === 2) {
    irrigationRanges = [
      moment(currentDate + " 06:00:00"),
      moment(currentDate + " 15:00:00"),
    ]
  } else {
    irrigationRanges = [
      moment(currentDate + " 09:00:00")
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
      id: last_index + 1 + i,
      parcelName: config.parcelName,
      config: newConfig,
      startTime,
      endTime
    }
    nextIrrigations.push(irrigation);
  }

  if(numberOfIrrigations === 2){
    console.log('setting in false')
    localStorage.setItem('onePreviousIrrigation', '0')
  } else {
    localStorage.setItem('onePreviousIrrigation', '1')
  }
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
    internalResponseDataset.numberOfIrrigations = 1;
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
  // console.log("internal", internalResponseDataset);
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

document.getElementById("btnRiegoFinalizado").addEventListener("click", function () {
  // Marcar el riego como finalizado
  nextIrrigations.forEach(function (riego, index) {
    if (riego.isPending) {
      nextIrrigations[index] = { ...riego, isPending: false }
      // Realizar ajustes adicionales en el programa de riego si es necesario
    }
  });

  // Actualizar el almacenamiento local
  localStorage.setItem('nextIrrigations', JSON.stringify(nextIrrigations));
});
