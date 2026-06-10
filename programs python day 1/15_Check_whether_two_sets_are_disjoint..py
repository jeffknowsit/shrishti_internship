print("elements in set 1")
set1=eval(input())
print()
print("elements in set 2")
print()
set2=eval(input())
print()
z=set1.intersection(set2)
if(len(z)==0):
    print("set1 and set2 are disjoint sets")
    exit(1)
else:
    print("set1 and set2 are not disjoint set")
    