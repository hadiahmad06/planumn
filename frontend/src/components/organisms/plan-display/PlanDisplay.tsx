import { MobileContext } from "@/contexts/visual/MobileContext";
import { useContext } from "react";
import PlanDisplayDesktop from "./PlanDisplayDesktop";
import PlanDisplayMobile from "./PlanDisplayMobile";

export default function PlanDisplay() {
    const { isMobile } = useContext(MobileContext);
    return (isMobile ? <PlanDisplayMobile/> : <PlanDisplayDesktop/>)
}