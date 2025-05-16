import { useEffect, useMemo, useState } from "react";
import InputSelect from "../components/InputSelect";
const API_URL = import.meta.env.VITE_API_URL;
import WorldMap from "react-svg-worldmap";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deslugify = str => {
    const words = str.split('-');
    const capitalizedWords = words.map(w => {
        const firstChar = w.charAt(0).toUpperCase();
        const rest = w.slice(1);
        return `${firstChar}${rest}`;
    });
    return capitalizedWords.join(' ');
}

function makeItalianMessage(visaInfo, daysString){
    if(visaInfo.isVisaRequired){
        return 'È richiesto un visto per il tuo passaporto.';
    }else if(visaInfo.isEVisa){
        return 'È richiesto un visto elettronico per il tuo passaporto.';
    }else{
        const days = parseInt(daysString);
        if(!visaInfo.visaDays){
            return `Non è richiesto un visto per il tuo passaporto.`;
        }
        if(isNaN(days)){
            return '';
        }
        if(days <= visaInfo.visaDays){
            return `Non è richiesto un visto per il tuo passaporto.`;
        }else{
            return `È richiesto un visto per il tuo passaporto${visaInfo.visaDays ? ` oltre ${visaInfo.visaDays} giorni` : ''}.`;
        }
    }
}

function makeVisaClassName(visaInfo, daysString){
    if(visaInfo.isVisaRequired){
        return 'vr';
    }else if(visaInfo.isEVisa){
        return 'ev';
    }else{
        const days = parseInt(daysString);
        if(!visaInfo.visaDays){
            return 'vf';
        }
        if(isNaN(days)){
            return '';
        }
        if(days <= visaInfo.visaDays){
            return 'vf';
        }else{
            return 'vr';
        }
    }
}

export default function HomePage() {

    const [passports, setPassports] = useState(null);
    useEffect(() => {
        (async () => {
            try{
                const res = await fetch(`${API_URL}/passport`);
                const data = await res.json();
                setPassports(data);
            }catch(error){
                console.error(error);
                setPassports({error: true, message: `C'è stato un errore nel caricare i dati.`});
            }
        })();
    }, []);

    const [countries, setCountries] = useState(null);
    useEffect(() => {
        (async () => {
            try{
                const res = await fetch(`${API_URL}/country`);
                const data = await res.json();
                setCountries(data);
            }catch(error){
                console.error(error);
                setCountries({error: true, message: `C'è stato un errore nel caricare i dati.`});
            }
        })();
    }, []);

    const [selectedPassport, setSelectedPassport] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedDays, setSelectedDays] = useState('');
    
    const [selectedVisa, setSelectedVisa] = useState(null);
    useEffect(() => {
        if(selectedPassport && selectedCountry){
            (async () => {
                try{
                    const res = await fetch(`${API_URL}/passport/${selectedPassport.slug}`);
                    const data = await res.json();
                    if(!data){
                        throw new Error('Nessun dato trovato');
                    }
                    const visa = data.countries.find(c => c.countryName === selectedCountry.slug);
                    if(!visa){
                        throw new Error('Nessun visto trovato');
                    }
                    setSelectedVisa(visa);
                }catch(error){
                    console.error(error);
                    setSelectedVisa({error: true, message: `C'è stato un errore nel caricare i dati.`});
                }
            })();
        }else{
            setSelectedVisa(null);
        }
    }, [selectedPassport, selectedCountry, selectedDays]);
    useEffect(() => {
        console.log(selectedPassport);
    },[selectedPassport]);

    const mapData = useMemo(() => {
        return passports ? [
            ...passports.map(p => ({country: p.id, value: 1})),
        ] : []
    }, [passports])

    const handleMapClick = ({countryName, countryCode}) => {
        if(!selectedPassport){
            const passport = passports.find(p => p.id === countryCode?.toLowerCase());
            if(passport){
                setSelectedPassport(passport);
            }
            return;
        }
        if(!selectedCountry){
            const country = countries.find(c => c.id === countryCode?.toLowerCase());
            if(country){
                setSelectedCountry(country);
            }
        }
    }

    const styleFunction = ({countryCode}) => {
        const isPassport = countryCode?.toLowerCase() === selectedPassport?.id;
        const isCountry = countryCode?.toLowerCase() === selectedCountry?.id;
        return {
            fill: isPassport ? "green" : isCountry ? "gold" : "white",
            stroke: 'black',
        }
    }
    const tooltipTextFunction = ({countryName}) => {
        return countryName;
    }

    const userSuggestionMessage = () => {
        if(!selectedPassport){
            return 'Clicca sul paese a cui appartiene il tuo passaporto.';
        }
        if(!selectedCountry){
            return 'Clicca sul paese dove vuoi viaggiare.';
        }
        if(!selectedDays){
            return 'Inserisci il numero di giorni di permanenza.';
        }
    }

    const [zoomLevel, setZoomLevel] = useState(1);
    const changeZoom = (dir) => {
        setZoomLevel(curr => {
            const newZoomLevel = curr + dir;
            if(dir > 0 && newZoomLevel <= 4){
                return newZoomLevel;
            }
            if(dir < 0 && newZoomLevel >= 1){
                return newZoomLevel;
            }
            return curr;
        });
    }

    
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    useEffect(() => {
        const resize = () => {
            setWindowWidth(window.innerWidth);
        }
        window.addEventListener('resize', resize);
        return () => {
            window.removeEventListener('resize', resize);
        } 
    }, []);

    return (
        <div className="page home-page">
            <h1>Controllo Visto Richiesto</h1>
            {(selectedVisa === null || selectedVisa.visaDays) &&
                <p className="user-message">{userSuggestionMessage()}</p>
            }
            <div className="map-container">
                <div className={`map-wrapper`}>
                    <WorldMap
                        color="red"
                        size={zoomLevel * (windowWidth * .8)}
                        data={mapData}
                        backgroundColor="lightblue"
                        onClickFunction={handleMapClick}
                        styleFunction={styleFunction}
                        tooltipTextFunction={tooltipTextFunction}
                    />
                </div>
                <div className="zoom">
                    <button onClick={() => changeZoom(1)}>+</button>
                    <button onClick={() => changeZoom(-1)}>-</button>
                </div>
            </div>
            <div className="form-container">
                {/* Sto caricando i passaporti... */}
                {passports === null && <p>Sto caricando i passaporti...</p>}
                {/* C'è stato un errore nel recuperare i passaporti */}
                {passports?.error && <p>{passports.message}</p>}
                {/* Ho i passaporti */}
                {Array.isArray(passports) && 
                    <InputSelect
                        selectedOption={selectedPassport?.id ? {
                            value: selectedPassport.id,
                            label: deslugify(selectedPassport.slug)
                        } : null} 
                        onChange={(value) => {
                            const passport = passports.find(p => p.id === value);
                            setSelectedPassport(passport || null);
                        }}
                        options={passports.map((passport) => {
                            if(selectedCountry && selectedCountry.slug === passport.slug){
                                return null;
                            }
                            return {
                                label: deslugify(passport.slug),
                                value: passport.id
                            }
                        })}
                        placeholder="Che passaporto hai?"
                        selectedBgColor="hsl(115, 100%, 81%)"
                    />
                }

                {/* Sto caricando i paesi... */}
                {countries === null && <p>Sto caricando i paesi...</p>}
                {/* C'è stato un errore nel recuperare i paesi */}
                {countries?.error && <p>{countries.message}</p>}
                {/* Ho i paesi */}
                {Array.isArray(countries) && 
                    <InputSelect
                        selectedOption={selectedCountry?.id ? {
                            value: selectedCountry.id,
                            label: deslugify(selectedCountry.slug)
                        } : null}
                        onChange={(value) => {
                            const country = countries.find(c => c.id === value);
                            setSelectedCountry(country || null);
                        }}
                        options={countries.map((country) => {
                            if(selectedPassport && selectedPassport.slug === country.slug){
                                return null;
                            }
                            return {
                                label: deslugify(country.slug),
                                value: country.id
                            }
                        })}
                        placeholder="Dove vai di bello?"
                        selectedBgColor="hsl(59, 100%, 81%)"
                    />
                }
                {selectedVisa?.visaDays &&
                    <input
                        type="number"
                        placeholder="Giorni di permanenza"
                        value={selectedDays}
                        onChange={e => setSelectedDays(e.target.value)}
                        className={`days-input ${parseInt(selectedDays) ? 'selected' : ''}`}
                    />
                }
            </div>
            {selectedVisa !== null && <>
                {selectedVisa?.error && <p>{selectedVisa.message}</p>}
                {selectedVisa && !selectedVisa.error &&
                    <p className={makeVisaClassName(selectedVisa, selectedDays)}>
                        {makeItalianMessage(selectedVisa, selectedDays)}
                    </p>
                }
            </>}
        </div>
    );
}