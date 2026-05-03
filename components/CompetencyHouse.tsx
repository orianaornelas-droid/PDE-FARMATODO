import React from 'react';
import { COMPETENCY_MODELS } from '../constants/competencyModels';

interface Props {
  cargo: string;
}

const CompetencyHouse: React.FC<Props> = ({ cargo }) => {
  const model = COMPETENCY_MODELS[cargo] || COMPETENCY_MODELS['APV Senior'];

  // Split impulsando into two for the two top arrows
  const impulsandoLeft = model.impulsando.slice(0, Math.ceil(model.impulsando.length / 2));
  const impulsandoRight = model.impulsando.slice(Math.ceil(model.impulsando.length / 2));

  return (
    <div className="w-full flex justify-center items-center p-4 bg-[#f4f4f4] min-h-[700px]">
      <div className="relative w-[800px] h-[600px] bg-white shadow-2xl overflow-hidden scale-[0.6] sm:scale-[0.8] md:scale-100 origin-center border border-gray-200">
        {/* --- Título superior --- */}
        <div className="absolute top-5 left-5 z-10">
          <h1 className="text-[32px] font-black text-gray-800 uppercase leading-none">Modelo</h1>
          <p className="text-[20px] font-bold text-gray-700 uppercase leading-tight mt-1">
            {cargo}<br />
            <span className="text-blue-600 text-sm tracking-widest">OPERACIONES</span>
          </p>
        </div>

        {/* --- Flechas Superiores Azules --- */}
        <div className="absolute top-[150px] left-[-30px] w-[300px] h-20 bg-[#0056b3] text-white flex items-center px-8 font-bold text-sm z-20 shadow-lg">
          <div className="flex flex-col">
            {impulsandoLeft.map((c, i) => (
              <span key={i} className="uppercase leading-tight">{c.name} {c.level}</span>
            ))}
          </div>
          <div className="absolute right-[-20px] top-0 w-0 h-0 border-t-[40px] border-t-transparent border-b-[40px] border-b-transparent border-l-[20px] border-l-[#0056b3]"></div>
        </div>

        <div className="absolute top-[200px] right-[-30px] w-[320px] h-20 bg-[#0056b3] text-white flex flex-col justify-center items-end px-8 font-bold text-sm z-20 text-right shadow-lg">
          {impulsandoRight.length > 0 ? impulsandoRight.map((c, i) => (
            <span key={i} className="uppercase leading-tight">{c.name} {c.level}</span>
          )) : impulsandoLeft.map((c, i) => (
            <span key={i} className="uppercase leading-tight">{c.name} {c.level}</span>
          ))}
          <div className="absolute left-[-20px] top-0 w-0 h-0 border-t-[40px] border-t-transparent border-b-[40px] border-b-transparent border-r-[20px] border-r-[#0056b3]"></div>
        </div>

        {/* --- Flechas Inferiores Claros (Gris-Azul) --- */}
        <div className="absolute bottom-[110px] left-[-30px] w-[280px] h-[100px] bg-[#a0bede] text-white flex flex-col justify-center px-8 font-bold text-[11px] z-20 shadow-md">
          {model.generando.map((c, i) => (
            <span key={i} className="uppercase leading-tight mb-0.5">{c.name} {c.level}</span>
          ))}
          <div className="absolute right-[-20px] top-0 w-0 h-0 border-t-[50px] border-t-transparent border-b-[50px] border-b-transparent border-l-[20px] border-l-[#a0bede]"></div>
        </div>

        <div className="absolute bottom-[110px] right-[-30px] w-[340px] h-[100px] bg-[#a0bede] text-white flex flex-col justify-center items-end px-8 font-bold text-[10px] z-20 text-right shadow-md">
          {model.alcanzando.map((c, i) => (
            <span key={i} className="uppercase leading-tight mb-0.5">{c.name} {c.level}</span>
          ))}
          <div className="absolute left-[-20px] top-0 w-0 h-0 border-t-[50px] border-t-transparent border-b-[50px] border-b-transparent border-r-[20px] border-r-[#a0bede]"></div>
        </div>

        {/* --- Estructura Central de la Casa --- */}
        <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[300px] flex flex-col items-center">
          {/* Roof */}
          <div className="w-0 h-0 border-l-[150px] border-l-transparent border-r-[150px] border-r-transparent border-b-[150px] border-b-[#004090] relative">
            <div className="absolute top-[80px] left-[-100px] w-[200px] text-center text-white font-black text-[15px] uppercase leading-tight tracking-tighter">
              IMPULSANDO<br />A FARMATODO
            </div>
          </div>
          {/* Body */}
          <div className="w-[300px] h-[250px] bg-[#004090] flex justify-around p-5 box-border text-white font-black text-center relative">
            <div className="w-24 text-[13px] pt-12 uppercase tracking-tighter">
              GENERANDO<br />CAPACIDAD
            </div>
            <div className="w-24 text-[13px] pt-12 uppercase tracking-tighter">
              ALCANZANDO<br />LA<br />EXCELENCIA
            </div>
            
            {/* Door with Logo */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60px] h-[80px] bg-white rounded-t-lg flex items-center justify-center p-2 shadow-inner border-t-4 border-x-4 border-[#004090]">
              <img 
                src="https://raw.githubusercontent.com/farmatodo/assets/main/logo-vertical-blue.png" 
                alt="Farmatodo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/farmatodo/100/100';
                }}
              />
            </div>
          </div>
        </div>

        {/* --- Panel de Valores (Base) --- */}
        <div className="absolute bottom-0 left-0 w-full h-[60px] bg-[#003366] text-white flex justify-center items-center text-[36px] font-black uppercase tracking-[0.3em] italic">
          VALORES
        </div>
      </div>
    </div>
  );
};

export default CompetencyHouse;
