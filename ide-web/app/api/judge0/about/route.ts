import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    "version": "1.13.0",
    "homepage": "https://judge0.com",
    "source_code": "https://github.com/judge0/judge0",
    "maintainer": "Herman Zvonimir Došilović <hermanz.dosilovic@gmail.com>",
    "languages": [
      {
        "id": 50,
        "name": "C (GCC 9.2.0)"
      },
      {
        "id": 54,
        "name": "C++ (GCC 9.2.0)"
      },
      {
        "id": 62,
        "name": "Java (OpenJDK 13.0.1)"
      },
      {
        "id": 63,
        "name": "JavaScript (Node.js 12.14.0)"
      },
      {
        "id": 71,
        "name": "Python (3.8.1)"
      }
    ]
  });
}
