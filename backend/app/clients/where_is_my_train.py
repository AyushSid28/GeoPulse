import httpx
from datetime import datetime

BASE_URL="https://whereismytrain.in/cache/live_status"

class WhereIsMyTrainClient:

    async def get_live_status(self,train_no:str,date:str)->dict:
        """
         train_no:string train number
         date: YYYY-MM-DD
          

        """ 

        formatted_date=self._format_date(date)

        params={
            "train_no":train_no,
            "date":formatted_date,
            "lang":"en",

        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response=await client.get(BASE_URL,params=params)

            if response.status_code!=200:
                raise RuntimeError(
                    f"Where Is my Train API returned {response.status_code}: {response.text}"
                )

            data=response.json()
            return self._map_response(data)

        except httpx.TimeoutException:
            raise Exception("Request to Where Is My Train API timed out")

        except httpx.RequestError as e:
            raise Exception(f"Request to Where Is My Train API failed: {str(e)}")

        
    def _format_date(self,date:str)->str:
        """
        Convert YYYY-MM-DD to dd-mm-yyyy
        """

        dt=datetime.strptime(date,"%Y-%m-%d")
        return dt.strftime("%d-%m-%Y")

    def _map_response(self,data:dict)->dict:
        """
        Normalize the response of external api to internal live-status shape
        """
        current_station=data.get("current_station")
        next_station=data.get("next_station")
        delay=data.get("delay")
        route=data.get("route",[])

        return{
            "current_station":current_station,
            "next_station":next_station,
            "delay":delay,
            "route":route,
        }
