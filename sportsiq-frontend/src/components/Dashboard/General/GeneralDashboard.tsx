import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";

import Loading from "../../Loading";
import { userStore } from "../../../store";
import { fetchAllGames as fetchAllGamesService } from "../../../services/gameService";
import { Game } from "../../../types/general";
import GamesDashboard from "./GamesDashboard";

export default function GeneralDashboard() {
  const { id } = useParams<{ id: string }>();
  const { setProfileID, dashboardSettings } = userStore();
  const swiperRef = useRef<SwiperRef | null>(null);

  const [allGames, setAllGames] = useState<Game[] | null>(null);

  useEffect(() => {
    if (id) {
      setProfileID(id);
      fetchAllGames();

      const allGamesInterval = setInterval(fetchAllGames, 5000);
      return () => clearInterval(allGamesInterval);
    }
  }, [id]);

  useEffect(() => {
    if (!dashboardSettings?.interval_dashboard_rotation_time) return;

    const interval = setInterval(() => {
      swiperRef.current?.swiper.slideNext();
    }, dashboardSettings?.interval_dashboard_rotation_time * 1000 || 30000);

    return () => clearInterval(interval);
  }, [dashboardSettings?.interval_dashboard_rotation_time]);

  const fetchAllGames = async () => {
    const allGamesData = await fetchAllGamesService();
    setAllGames(allGamesData);
  };

  if (!id || !dashboardSettings || !allGames) return <Loading />;
  const dashboardGameTypes = dashboardSettings.dashboard_game_types;

  return (
    <>
      {dashboardGameTypes.length > 1 ? (
        <>
          <Swiper
            ref={swiperRef}
            spaceBetween={50}
            slidesPerView={1}
            onSlideChange={() => {}}
            onSwiper={() => {}}
            loop={true}
            initialSlide={0}
            className="w-full h-full"
            onInit={() => {}}
            direction="horizontal"
            speed={300}
          >
            {dashboardGameTypes.map((gameType) => (
              <SwiperSlide key={gameType}>
                <GamesDashboard
                  gameType={gameType}
                  games={allGames.filter((game) => game.game_type === gameType)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </>
      ) : dashboardGameTypes.length === 1 ? (
        <GamesDashboard
          gameType={dashboardGameTypes[0]}
          games={allGames.filter(
            (game) => game.game_type === dashboardGameTypes[0]
          )}
        />
      ) : (
        <></>
      )}
    </>
  );
}
