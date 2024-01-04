import { assign, createMachine, fromPromise } from "xstate";
import { fetchCountries } from "../Utils/api";

const fillCountries = {
  initial: "loading",
  states: {
    loading: {
      invoke: {
        id: "getCountries",
        src: fromPromise(() => fetchCountries()),
        onDone: {
          target: "success",
          actions: "setCountries",
        },
        onError: {
          target: "failure",
          actions: assign({
            error: "Falló el request",
          }),
        },
      },
    },
    success: {},
    failure: {
      on: {
        RETRY: { target: "loading" },
      },
    },
  },
};

const bookingMachine = createMachine(
  {
    id: "buy plane tickets",
    initial: "initial",
    context: {
      passengers: [],
      selectedCountry: "",
      countries: [],
      error: "",
    },
    states: {
      initial: {
        on: {
          START: {
            target: "search",
          },
        },
      },
      search: {
        on: {
          CONTINUE: {
            target: "passengers",
            actions: assign({
              selectedCountry: ({ event }) => event.value,
            }),
          },
          CANCEL: "initial",
        },
        ...fillCountries,
      },
      tickets: {
        after: {
          5000: {
            target: "initial",
            actions: "cleanContext",
          },
        },
        on: {
          FINISH: {
            target: "initial",
            actions: "cleanContext",
          },
        },
      },
      passengers: {
        on: {
          DONE: {
            guard: "moreThanOnePassenger",
            target: "tickets",
          },
          CANCEL: {
            target: "initial",
            actions: "cleanContext",
          },
          ADD: {
            target: "passengers",
            actions: assign(({ context, event }) =>
              context.passengers.push(event.value)
            ),
          },
        },
      },
    },
  },
  {
    actions: {
      imprimirInicio: () => console.log("Imprimir Inicio"),
      imprimirEntrada: () => console.log("Imprimir Entrada"),
      imprimirSalida: () => console.log("Imprimir Salida"),
      cleanContext: ({ context }) => {
        context.passengers = [];
        context.selectedCountry = "";
        return context;
      },
      // assign({
      //   selectedCountry: "",
      //   passengers: [],
      // }),
      setCountries: assign({
        countries: ({ event }) => event.output,
      }),
    },
    guards: {
      moreThanOnePassenger: ({ context }) => {
        return context.passengers.length > 0;
      },
    },
  }
);

export default bookingMachine;
