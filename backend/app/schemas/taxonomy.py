from pydantic import BaseModel, ConfigDict


class SubgroupExampleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role: str
    query: str


class SubgroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    subgroup_id: int
    code: str
    name: str
    purpose: str
    typical_role: str | None
    expected_retrieval: str | None
    order_index: int
    target_count: int
    examples: list[SubgroupExampleOut]
    done_count: int = 0


class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    group_id: int
    code: str
    name: str
    annotate_guidance: str | None
    order_index: int
    subgroups: list[SubgroupOut]


class LookupOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    value: str
    label: str


class UpdateSubgroupRequest(BaseModel):
    name: str | None = None
    purpose: str | None = None
    typical_role: str | None = None
    expected_retrieval: str | None = None
    target_count: int | None = None
