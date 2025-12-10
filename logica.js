let profesores = [];
let entrevistas = [];


//   CARGAR DATOS EJEMPLO
function usarEjemplo() {
    profesores = [
        {nombre: 'Lucas', horaInicio:'10:00', horaFin:'18:00'},
        {nombre: 'Anselmo', horaInicio:'07:00', horaFin:'15:00'},
        {nombre: 'Lucrecia', horaInicio:'12:00', horaFin:'20:00'},
        {nombre: 'Renato', horaInicio:'13:00', horaFin:'21:00'},
        {nombre: 'Florinda', horaInicio:'07:00', horaFin:'15:00'}
    ];

    entrevistas = [
        {id:1, profesores:['Lucas','Anselmo','Florinda']},
        {id:2, profesores:['Renato','Anselmo','Lucrecia']},
        {id:3, profesores:['Lucas','Lucrecia','Florinda']},
        {id:4, profesores:['Renato','Lucas','Florinda']},
        {id:5, profesores:['Lucrecia','Anselmo','Florinda']},
        {id:6, profesores:['Anselmo','Lucas','Florinda']},
        {id:7, profesores:['Anselmo','Florinda','Renato']},
        {id:8, profesores:['Lucrecia','Renato','Lucas']}
    ];
}

//   convertir horas a minutos y viceversa para mostrar en pantalla
function parseTime(t){ let [h,m]=t.split(':').map(Number); return h*60+m; }
function formatTime(m){ return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}` }


//Genera todas las fechas entre la fecha inicio y la fecha fin, excluyendo los días no hábiles.
function getDatesInRange(start, end, exclude){
    const list = [];

    let [y, m, d] = start.split("-").map(Number);
    let c = new Date(y, m - 1, d);

    let [y2, m2, d2] = end.split("-").map(Number);
    let f = new Date(y2, m2 - 1, d2);

    while(c <= f){
        if(!exclude.includes(c.getDay())) {
            list.push(new Date(c));
        }
        c.setDate(c.getDate() + 1);
    }
    return list;
}

//Divide en bloques los horarios 
function generarSlots(fechas, inicio, fin, dur){
    const slots=[];
    for(const fecha of fechas){
        let t=inicio;
        while(t+dur<=fin){
            slots.push({fecha:new Date(fecha), horaInicio:t, horaFin:t+dur});
            t+=dur;
        }
    }
    return slots;
}

//Verificar si el profesor esta disponible
function profesorDisponible(prof, slot){
    const p = profesores.find(x=>x.nombre===prof);
    if(!p) return false;
    return slot.horaInicio>=parseTime(p.horaInicio) &&
           slot.horaFin<=parseTime(p.horaFin);
}
//verifica entrevistas en mismo dia, hora o mismo profesor
function hayConflicto(entrevista,slot,programadas){
    return programadas.some(p =>
        p.slot.fecha.getTime()===slot.fecha.getTime() &&
        p.slot.horaInicio===slot.horaInicio &&
        p.entrevista.profesores.some(pr => entrevista.profesores.includes(pr))
    );
}
//Cuenta cuántas entrevistas ya están agendadas en ese mismo bloque.
function contarConcurrentes(slot,programadas){
    return programadas.filter(p => 
        p.slot.fecha.getTime()===slot.fecha.getTime() &&
        p.slot.horaInicio===slot.horaInicio
    ).length;
}

//asigna un puntaje si el porfesor esta poco disponible
function calcularDificultad(ent){
    let score=0;
    for(const n of ent.profesores){
        const p = profesores.find(x=>x.nombre===n);
        if(p){
            let disp = parseTime(p.horaFin)-parseTime(p.horaInicio);
            score += 1000/disp;
        }
    }
    return score;
}


// planificar 
function planificar(){
    if(profesores.length===0 || entrevistas.length===0){
        alert("Carga datos");
        return;
    }

    const fechaInicio=document.getElementById("fechaInicio").value;
    const fechaFin=document.getElementById("fechaFin").value;
    const diasNoHabiles=document.getElementById("diasNoHabiles").value.split(',').map(x=>parseInt(x));
    const horaInicio=parseTime(document.getElementById("horaInicio").value);
    const horaFin=parseTime(document.getElementById("horaFin").value);
    const duracion=parseInt(document.getElementById("duracion").value)*60;
    const maxConcurrentes=parseInt(document.getElementById("maxConcurrentes").value);

    const fechas = getDatesInRange(fechaInicio,fechaFin,diasNoHabiles);
    const slots = generarSlots(fechas,horaInicio,horaFin,duracion);//obtiene todos los datos

    const ordenadas = [...entrevistas].sort((a,b)=>calcularDificultad(b)-calcularDificultad(a));//ordena por dificultad

    const programadas=[];
    const fallidas=[];

    for(const e of ordenadas){
        let asignada=false;

        for(const slot of slots){// asigna entrevistas al primer bloque posible
            if(!e.profesores.every(p=>profesorDisponible(p,slot))) continue;
            if(hayConflicto(e,slot,programadas)) continue;
            if(contarConcurrentes(slot,programadas)>=maxConcurrentes) continue;

            programadas.push({entrevista:e,slot});
            asignada=true;
            break;
        }

        if(!asignada){
            fallidas.push({entrevista:e, razon:"No hay slot válido"});
        }
    }

    mostrarResultados(programadas, fallidas);
}

//   MOSTRAR RESULTADOS
function mostrarResultados(programadas, fallidas){
    const div = document.getElementById("results");
    div.innerHTML="";
    div.style.display="block";

    let html=`<h2>Resultados</h2>`;

    programadas.forEach(p=>{
        html+=`
            <div class="interview-card">
                <strong>Entrevista ${p.entrevista.id}</strong><br>
                ${p.entrevista.profesores.join(", ")}<br>
                ${p.slot.fecha.toDateString()} | ${formatTime(p.slot.horaInicio)} - ${formatTime(p.slot.horaFin)}
            </div>
        `;
    });

    fallidas.forEach(f=>{
        html+=`
            <div class="interview-card failed">
                <strong>Entrevista ${f.entrevista.id}</strong><br>
                No asignada (${f.razon})
            </div>`;
    });

    div.innerHTML = html;
}
