import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide, type SwiperRef } from "swiper/react";

import SportsbookCard, { SportsbookCardProps } from "../../SportsbookCard";
import SubBettingCard, { SubBettingCardProps } from "../SubBettingCard";
import VSProgressBarCard, {
  VSProgressBarCardProps,
} from "../../VSProgressBarCard";

type Props = {
  isLarge: boolean;
  cardState: number;
  sportsbookData: SportsbookCardProps[];
  probabilityData: SubBettingCardProps[];
  statsData: VSProgressBarCardProps[];
};

export default function LiveGameCardBody({
  isLarge,
  cardState,
  sportsbookData,
  probabilityData,
  statsData,
}: Props) {
  const swiperRef = useRef<SwiperRef | null>(null);

  useEffect(() => {
    if (cardState % 3 === 0) {
      swiperRef.current?.swiper?.slideTo(0);
    } else if (cardState % 3 === 1) {
      swiperRef.current?.swiper?.slideTo(1);
    } else {
      swiperRef.current?.swiper?.slideTo(2);
    }
  }, [cardState]);

  const headerTabs: string[] = ["Live", "Projections", "Stats"];

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        {/* Header Tabs */}
        <div className="w-full h-8 flex items-start jusitfy-between shrink-0">
          {headerTabs.map((tab, index) => (
            <div
              key={`header-tab-${index}-${tab}`}
              className={`w-full h-full flex items-start justify-center border-white text-white text-lg ${
                index === cardState % 3
                  ? "border-b-3 font-semibold"
                  : "border-b-2 opacity-40"
              }`}
            >
              {tab === "Live" ? (
                <span className="flex items-center gap-2 -mt-1">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white"></span>
                    <span className="relative inline-flex size-2.5 rounded-full bg-white"></span>
                  </span>
                  <span>{tab}</span>
                </span>
              ) : (
                <span className="-mt-1">{tab}</span>
              )}
            </div>
          ))}
        </div>

        {/* Content Body */}
        <Swiper
          ref={swiperRef}
          spaceBetween={50}
          slidesPerView={1}
          onSlideChange={() => {}}
          onSwiper={() => {}}
          loop={true}
          initialSlide={0}
          className="w-full h-full flex flex-col items-center justify-center"
          onInit={() => {}}
          direction="horizontal"
        >
          {/* Sportsbook */}
          <SwiperSlide>
            <div className="w-full h-full grid grid-cols-4 gap-1.5">
              {sportsbookData.map(
                (data: SportsbookCardProps, index: number) => (
                  <SportsbookCard key={index} isLarge={isLarge} data={data} />
                )
              )}
            </div>
          </SwiperSlide>

          {/* Probability */}
          <SwiperSlide>
            <div className="w-full h-full flex flex-col items-center justify-between gap-1.5">
              {probabilityData.map(
                (data: SubBettingCardProps, index: number) => (
                  <SubBettingCard key={index} data={data} />
                )
              )}
            </div>
          </SwiperSlide>

          {/* Stats */}
          <SwiperSlide>
            <div className="w-full h-full flex flex-col items-center justify-between gap-1.5">
              {statsData.map((data: VSProgressBarCardProps, index: number) => (
                <span
                  key={`stats-card-${index}`}
                  className="w-full h-full bg-white rounded-sm flex items-center justify-center px-3"
                >
                  <VSProgressBarCard
                    key={index}
                    showProgressBar={isLarge}
                    data={data}
                  />
                </span>
              ))}
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </>
  );
}
