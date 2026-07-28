import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/dashboard/StatCard";

describe("StatCard", () => {
  it("renders the title and metric", () => {
    render(<StatCard title="Proyectos activos" metric="3" />);

    expect(screen.getByText("Proyectos activos")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the delta badge when provided", () => {
    render(
      <StatCard title="Latencia p95" metric="310 ms" delta="+3%" deltaType="moderateIncrease" />
    );

    expect(screen.getByText("+3%")).toBeInTheDocument();
  });
});
