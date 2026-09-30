import geopandas as gpd
import pyogrio

tis = gpd.read_file("data/area_de_estudo.geojson", engine="pyogrio")
print("Colunas de tis:", tis.columns.tolist())
print(tis.head(2))

existing_water = gpd.read_file("data/massa_de_agua.geojson", engine="pyogrio")
print("Colunas de existing_water:", existing_water.columns.tolist())
print("Total feições existing_water:", len(existing_water))
print(existing_water.head(2))
