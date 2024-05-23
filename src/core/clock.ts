class Clock {
  private lastTime = 0;
  private deltaTime = 0;
  private totalTime = 0;
  private shouldTick = false;

  getDeltaTime() {
    return this.deltaTime;
  }

  getTotalTime() {
    return this.totalTime;
  }

  canTick() {
    return this.shouldTick;
  }

  tick(fps: number) {
    const interval = 1 / fps;
    const now = Clock.now() / 1000
    const elapsed = now - this.lastTime
    this.shouldTick = false;
    this.totalTime += elapsed;
    
    if (elapsed > interval) {
        this.lastTime = now - (elapsed % interval);
        this.deltaTime = elapsed
        this.shouldTick = true;
        return this.shouldTick; 
    }

    return this.shouldTick;
  }

  static now() {
    return (typeof performance === "undefined" ? Date : performance).now();
  }
}

export { Clock };

