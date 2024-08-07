'use client';

import { toast } from 'react-toastify';
import { createContext, ReactNode, useEffect, useState } from 'react';

import { getCoordsFromGeocodingInfo } from '@/lib';

import { Loading } from '@/components';
import type { WeatherData, Coordinates, GoogleGeocodingInfo } from '@/types';

interface WeatherContextType {
  currentCityCoords?: Coordinates;
  updateWeatherData: (props: Coordinates) => Promise<void>;
  isLoading: boolean;
  weatherData: WeatherData;
}

export const WeatherContext = createContext<WeatherContextType>(
  {} as WeatherContextType,
);
export function WeatherContextProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [isLoading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData>(
    {} as WeatherData,
  );
  const [currentCityCoords, setCurrentCityCoords] = useState<Coordinates>();

  const showError = (err: Error) => {
    setLoading(false);
    toast.error(`${err}`);
  };

  async function updateWeatherData(coords: Coordinates) {
    if (!coords) {
      const errorMsg = 'Error while updating weather: Unknown city';
      showError(new Error(errorMsg));
      return;
    }

    setLoading(true);

    let newCoords = { ...coords };

    try {
      if (!newCoords.latitude || !newCoords.longitude) {
        const formattedPlace = (newCoords.name as string)
          .replaceAll(' ', '+')
          .replaceAll(',', '+');

        const geocodingResponse = await fetch(
          `/api/geocoding?place=${formattedPlace}`,
        );
        const geocodingInfo =
          (await geocodingResponse.json()) as GoogleGeocodingInfo;
        const googleCoords = getCoordsFromGeocodingInfo(geocodingInfo);

        newCoords = { ...googleCoords };
      }

      const weatherResponse = await fetch(
        `/api/weather?lat=${newCoords.latitude}&lng=${newCoords.longitude}`,
      );
      const data = (await weatherResponse.json()) as WeatherData;

      setCurrentCityCoords(newCoords);
      setWeatherData(data);
      setLoading(false);
    } catch (error: any) {
      showError(error);
    }
  }

  useEffect(() => {
    updateWeatherData({ name: 'Vitoria,Espirito Santo,BRA' });
  }, []);

  return (
    <WeatherContext.Provider
      value={{
        weatherData,
        isLoading,
        currentCityCoords,
        updateWeatherData,
      }}
    >
      {!weatherData || !Object.keys(weatherData).length ? (
        <Loading />
      ) : (
        children
      )}
    </WeatherContext.Provider>
  );
}

