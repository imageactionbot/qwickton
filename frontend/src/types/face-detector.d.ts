interface FaceDetectorBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceDetectorResult {
  boundingBox: FaceDetectorBoundingBox;
}

interface FaceDetector {
  detect(image: ImageBitmap): Promise<FaceDetectorResult[]>;
}

declare const FaceDetector: {
  prototype: FaceDetector;
  new (): FaceDetector;
};
