import math
from typing import Dict, List

EARTH_RADIUS = 6371000


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])

    dlat = lat2 - lat1
    dlng = lng2 - lng1

    a = (math.sin(dlat / 2) ** 2
         + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS * c


def snap_to_route(
    route_geometry: List[List[float]],
    user_lat: float,
    user_lng: float,
) -> Dict:
    min_distance = float("inf")
    snapped_lat = None
    snapped_lng = None
    best_segment_index = -1
    best_t = 0.0

    total_segments = len(route_geometry) - 1

    for i in range(total_segments):
        lng1, lat1 = route_geometry[i]
        lng2, lat2 = route_geometry[i + 1]

        dx = lng2 - lng1
        dy = lat2 - lat1

        if dx == 0 and dy == 0:
            continue

        t = ((user_lng - lng1) * dx + (user_lat - lat1) * dy) / (dx * dx + dy * dy)
        t = max(0.0, min(1.0, t))

        proj_lng = lng1 + t * dx
        proj_lat = lat1 + t * dy

        distance = haversine(user_lat, user_lng, proj_lat, proj_lng)

        if distance < min_distance:
            min_distance = distance
            snapped_lat = proj_lat
            snapped_lng = proj_lng
            best_segment_index = i
            best_t = t

    route_fraction = (best_segment_index + best_t) / total_segments if total_segments > 0 else 0.0

    return {
        "snapped_lat": snapped_lat,
        "snapped_lng": snapped_lng,
        "distance_meters": min_distance,
        "segment_index": best_segment_index,
        "route_fraction": route_fraction,
    }