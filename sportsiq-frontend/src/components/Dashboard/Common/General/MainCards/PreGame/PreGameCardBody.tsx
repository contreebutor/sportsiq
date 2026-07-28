import { useEffect, useRef } from "react";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import "swiper/css/effect-fade";

import SportsbookCard, { SportsbookCardProps } from "../../SportsbookCard";
import SubBettingCard, { SubBettingCardProps } from "../SubBettingCard";

interface Props {
  isLarge: boolean;
  cardState: number;
  bettingData: SubBettingCardProps[];
  sportsbookData: SportsbookCardProps[];
}

export default function PreGameCardBody({
  isLarge,
  cardState,
  bettingData,
  sportsbookData,
}: Props) {
  const swiperRef = useRef<SwiperRef | null>(null);

  useEffect(() => {
    if (cardState % 2 === 0) {
      swiperRef.current?.swiper?.slideTo(0);
    } else {
      if (swiperRef.current?.swiper?.activeIndex === 0) {
        swiperRef.current?.swiper?.slideTo(1);
      }
    }
  }, [cardState]);

  return (
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
        speed={100}
      >
        <SwiperSlide>
          <div className="w-full h-full flex flex-col items-center justify-between gap-1.5">
            {bettingData.map((data: SubBettingCardProps, index: number) => (
              <SubBettingCard key={index} data={data} />
            ))}
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="w-full h-full flex items-center justify-between gap-1.5">
            {sportsbookData.map((data: SportsbookCardProps, index: number) => (
              <SportsbookCard key={index} isLarge={isLarge} data={data} />
            ))}
          </div>
        </SwiperSlide>
      </Swiper>
    </>
  );
}
