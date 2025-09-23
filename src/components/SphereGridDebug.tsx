import React, { useEffect, useRef } from 'react';
import { Canvas as FabricCanvas, Circle } from 'fabric';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const SphereGridDebug: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const testRender = () => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 300,
      backgroundColor: '#1a1a2e'
    });

    // Add a simple test circle
    const circle = new Circle({
      left: 200,
      top: 150,
      radius: 30,
      fill: '#ff6b6b',
      stroke: '#ffffff',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center'
    });

    canvas.add(circle);
    canvas.renderAll();

    console.log('Test circle added, total objects:', canvas.getObjects().length);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Fabric.js Debug Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <canvas 
            ref={canvasRef} 
            className="border border-gray-300 rounded"
          />
          <Button onClick={testRender} className="w-full">
            Test Render Circle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};