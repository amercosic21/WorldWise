import { createContext, useCallback, useEffect, useReducer } from "react";

const STORAGE_KEY = "worldwise-cities";

const defaultCities = [
  {
    cityName: "Lisbon",
    country: "Portugal",
    emoji: "🇵🇹",
    date: "2027-10-31T15:59:59.138Z",
    notes: "My favorite city so far!",
    position: { lat: 38.727881642324164, lng: -9.140900099907554 },
    id: 73930385,
  },
  {
    cityName: "Madrid",
    country: "Spain",
    emoji: "🇪🇸",
    date: "2027-07-15T08:22:53.976Z",
    notes: "",
    position: { lat: 40.46635901755316, lng: -3.7133789062500004 },
    id: 17806751,
  },
  {
    cityName: "Berlin",
    country: "Germany",
    emoji: "🇩🇪",
    date: "2027-02-12T09:24:11.863Z",
    notes: "Amazing 😃",
    position: { lat: 52.53586782505711, lng: 13.376933665713324 },
    id: 98443197,
  },
];

const CitiesContext = createContext();

const initialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true };

    case "cities/loaded":
      return {
        ...state,
        isLoading: false,
        cities: action.payload,
      };

    case "city/loaded":
      return { ...state, isLoading: false, currentCity: action.payload };

    case "city/created":
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };

    case "city/deleted":
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };

    case "rejected":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    default:
      throw new Error("Unknown action type");
  }
}

function loadFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCities));
  return defaultCities;
}

function saveToStorage(cities) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(
    reducer,
    initialState
  );

  useEffect(function () {
    dispatch({ type: "loading" });
    try {
      const data = loadFromStorage();
      dispatch({ type: "cities/loaded", payload: data });
    } catch {
      dispatch({
        type: "rejected",
        payload: "There was an error loading cities...",
      });
    }
  }, []);

  const getCity = useCallback(
    function getCity(id) {
      if (Number(id) === currentCity.id) return;

      dispatch({ type: "loading" });
      try {
        const city = cities.find((c) => c.id === Number(id));
        if (!city) throw new Error("City not found");
        dispatch({ type: "city/loaded", payload: city });
      } catch {
        dispatch({
          type: "rejected",
          payload: "There was an error loading the city...",
        });
      }
    },
    [currentCity.id, cities]
  );

  async function createCity(newCity) {
    dispatch({ type: "loading" });
    try {
      const cityWithId = { ...newCity, id: Date.now() };
      const updated = [...cities, cityWithId];
      saveToStorage(updated);
      dispatch({ type: "city/created", payload: cityWithId });
    } catch {
      dispatch({
        type: "rejected",
        payload: "There was an error creating the city...",
      });
    }
  }

  async function deleteCity(id) {
    dispatch({ type: "loading" });
    try {
      const updated = cities.filter((c) => c.id !== id);
      saveToStorage(updated);
      dispatch({ type: "city/deleted", payload: id });
    } catch {
      dispatch({
        type: "rejected",
        payload: "There was an error deleting the city...",
      });
    }
  }

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        error,
        getCity,
        createCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

export { CitiesProvider, CitiesContext };
